import asyncio
import base64
import mimetypes
from dataclasses import dataclass
from typing import Any, TypeVar

from openai import APITimeoutError, OpenAI
from pydantic import BaseModel, ConfigDict, Field

from core.config import Settings
from inference.openai_client import create_openai_client
from inference.recipe_import_prompts import (
    IMAGE_MARKDOWN_EXTRACTION_INSTRUCTIONS,
    STRUCTURED_RECIPE_INSTRUCTIONS,
    TEXT_MARKDOWN_EXTRACTION_INSTRUCTIONS,
)

_MIN_IMAGE_TIMEOUT_SECONDS = 300.0
ParseModelT = TypeVar("ParseModelT", bound=BaseModel)


class ImportedIngredient(BaseModel):
    amount: float = Field(
        description="Ingredient quantity as float. Convert fractions to decimals. Use 0 if absent."
    )
    unit: str = Field(
        default="",
        description='Measurement unit only, such as "cup", "tsp", or "". Do not include counts or ingredient names.',
    )
    name: str = Field(description="Ingredient name only. Exclude quantity, count, and unit.")

    model_config = ConfigDict(extra="forbid")


class RecipeImportExtraction(BaseModel):
    name: str = Field(description="Recipe title. Prefer an explicit title. If missing, use a short descriptive title.")
    description: str = Field(
        default="",
        description="Short recipe description only when clearly supported by the source. Otherwise ''.",
    )
    notes: str = Field(
        default="",
        description="Helpful recipe notes from the source only. Exclude marketing copy. Use '' if absent.",
    )
    servings: int = Field(default=1, ge=1, description="Serving count. Use 1 if unknown.")
    category: str = Field(
        default="Main",
        description='Short recipe category such as Main, Dessert, Breakfast, Side, Drink, Snack, or Sauce. Use "Main" if unclear.',
    )
    tags: list[str] = Field(
        default_factory=list,
        description="Short tag labels from the source or obvious recipe type. Use [] if none.",
    )
    ingredients: list[ImportedIngredient] = Field(description="Ingredient list in recipe order.")
    instructions: list[str] = Field(
        description="Ordered recipe steps as plain strings, one step per item, without leading step numbers."
    )

    model_config = ConfigDict(extra="forbid")


class RecipeMarkdownExtraction(BaseModel):
    markdown: str = Field(
        description="Clean, recipe-only markdown using readable sections like title, ingredients, instructions, notes, tags, and servings."
    )

    model_config = ConfigDict(extra="forbid")


class ImageRecipeMarkdownExtraction(RecipeMarkdownExtraction):
    transcription: str = Field(
        description="Plain-text transcription of visible recipe content from the image only. Do not include user guidance."
    )


@dataclass(frozen=True)
class RecipeImportResult:
    recipe: RecipeImportExtraction
    intermediate_markdown: str
    metadata: dict[str, Any]


class RecipeImportStageError(RuntimeError):
    def __init__(self, message: str, intermediate_markdown: str, metadata: dict[str, Any] | None = None):
        super().__init__(message)
        self.intermediate_markdown = intermediate_markdown
        self.metadata = dict(metadata or {})


def _normalize_image_content_type(filename: str, content_type: str) -> str:
    normalized = (content_type or "").strip().lower()
    if normalized.startswith("image/"):
        return normalized

    guessed_type, _ = mimetypes.guess_type(filename or "")
    if guessed_type and guessed_type.startswith("image/"):
        return guessed_type

    return "image/png"


class RecipeImportClient:
    def __init__(self, settings: Settings, client: OpenAI | None = None):
        self.client = client or create_openai_client(settings)
        self.image_extraction_model = settings.image_extraction_model.strip()
        self.text_extraction_model = settings.text_extraction_model.strip()
        self.structure_model = settings.structure_model.strip()
        self.timeout = settings.llm_request_timeout

    async def parse_text(self, text: str) -> RecipeImportResult:
        intermediate = await asyncio.to_thread(
            self._parse,
            self.text_extraction_model,
            TEXT_MARKDOWN_EXTRACTION_INSTRUCTIONS,
            [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": f"<recipe_text>\n{text}\n</recipe_text>",
                        }
                    ],
                }
            ],
            RecipeMarkdownExtraction,
            self.timeout,
        )
        markdown = intermediate.markdown.strip()
        if not markdown:
            raise RuntimeError("LLM returned no intermediate recipe markdown")

        metadata = {
            "source": "text",
            "original_text": text,
        }

        try:
            recipe = await self._structure_recipe_markdown(markdown)
        except Exception as exc:
            raise RecipeImportStageError(str(exc), markdown, metadata) from exc

        return RecipeImportResult(recipe=recipe, intermediate_markdown=markdown, metadata=metadata)

    async def parse_image(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str,
        context_text: str | None = None,
    ) -> RecipeImportResult:
        data_url = self._build_data_url(image_bytes, filename, content_type)

        content: list[dict[str, Any]] = [
            {
                "type": "input_text",
                "text": "<recipe_image>\nExtract the recipe from this image.\n</recipe_image>",
            }
        ]

        normalized_context = (context_text or "").strip()
        if normalized_context:
            content.append(
                {
                    "type": "input_text",
                    "text": f"<user_guidance>\n{normalized_context}\n</user_guidance>",
                }
            )

        content.append(
            {
                "type": "input_image",
                "image_url": data_url,
            }
        )

        intermediate = await asyncio.to_thread(
            self._parse,
            self.image_extraction_model,
            IMAGE_MARKDOWN_EXTRACTION_INSTRUCTIONS,
            [
                {
                    "role": "user",
                    "content": content,
                }
            ],
            ImageRecipeMarkdownExtraction,
            max(self.timeout, _MIN_IMAGE_TIMEOUT_SECONDS),
        )

        markdown = intermediate.markdown.strip()
        transcription = intermediate.transcription.strip()
        if not markdown:
            raise RuntimeError("LLM returned no intermediate recipe markdown")
        if not transcription:
            raise RuntimeError("Model returned no transcription for the image")

        metadata = {
            "source": "image",
            "filename": filename,
            "content_type": content_type,
            "context_text": normalized_context or None,
            "image_transcription": transcription,
        }

        try:
            recipe = await self._structure_recipe_markdown(markdown)
        except Exception as exc:
            raise RecipeImportStageError(str(exc), markdown, metadata) from exc

        return RecipeImportResult(recipe=recipe, intermediate_markdown=markdown, metadata=metadata)

    def _build_data_url(self, image_bytes: bytes, filename: str, content_type: str) -> str:
        normalized_type = _normalize_image_content_type(filename, content_type)
        encoded = base64.b64encode(image_bytes).decode("utf-8")
        return f"data:{normalized_type};base64,{encoded}"

    async def _structure_recipe_markdown(self, markdown: str) -> RecipeImportExtraction:
        return await asyncio.to_thread(
            self._parse,
            self.structure_model,
            STRUCTURED_RECIPE_INSTRUCTIONS,
            [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": f"<recipe_markdown>\n{markdown}\n</recipe_markdown>",
                        }
                    ],
                }
            ],
            RecipeImportExtraction,
            self.timeout,
        )

    def _parse(
        self,
        model: str,
        instructions: str,
        input_payload: list[dict[str, Any]],
        text_format: type[ParseModelT],
        timeout_seconds: float,
    ) -> ParseModelT:
        try:
            response = self.client.responses.parse(
                model=model,
                instructions=instructions,
                input=input_payload,
                text_format=text_format,
                temperature=0.0,
                timeout=timeout_seconds,
            )
        except APITimeoutError as exc:
            raise RuntimeError(
                f"LLM request timed out after {timeout_seconds:.0f}s. "
                "The model may still be too slow for this image; try a smaller image, a faster model, "
                "or increase LLM_REQUEST_TIMEOUT."
            ) from exc

        parsed = response.output_parsed
        if parsed is None:
            raise RuntimeError("LLM returned no structured recipe output")
        return parsed


def create_recipe_import_client(settings: Settings) -> RecipeImportClient:
    return RecipeImportClient(settings)
