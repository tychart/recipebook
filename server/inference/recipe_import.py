import base64
import logging
import mimetypes
from dataclasses import dataclass
from typing import Any

from openai import APITimeoutError, AsyncOpenAI
from pydantic import BaseModel, ConfigDict, Field

from core.config import Settings
from inference.openai_client import create_openai_client
from inference.recipe_import_prompts import (
    IMAGE_MARKDOWN_EXTRACTION_INSTRUCTIONS,
    STRUCTURED_RECIPE_INSTRUCTIONS,
    TEXT_MARKDOWN_EXTRACTION_INSTRUCTIONS,
)

logger = logging.getLogger(__name__)


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


@dataclass(frozen=True)
class RecipeImportResult:
    recipe: RecipeImportExtraction
    first_stage_output: str
    metadata: dict[str, Any]


class RecipeImportStageError(RuntimeError):
    def __init__(self, message: str, first_stage_output: str, metadata: dict[str, Any] | None = None):
        super().__init__(message)
        self.first_stage_output = first_stage_output
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
    def __init__(self, settings: Settings, client: AsyncOpenAI | None = None):
        self.client = client or create_openai_client(settings)
        self.text_extraction_model = settings.text_extraction_model.strip()
        self.image_extraction_model = settings.image_extraction_model.strip()
        self.structure_model = settings.structure_model.strip()
        self.timeout = settings.llm_request_timeout

    async def parse_text(self, text: str) -> RecipeImportResult:
        first_stage_output = await self._run_text_stage1(text)
        metadata = {
            "source": "text",
            "original_text": text,
            "first_stage_output": first_stage_output,
        }

        try:
            recipe = await self._run_formatter_stage2(first_stage_output)
        except Exception as exc:
            raise RecipeImportStageError(str(exc), first_stage_output, metadata) from exc

        return RecipeImportResult(recipe=recipe, first_stage_output=first_stage_output, metadata=metadata)

    async def parse_image(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str,
        context_text: str | None = None,
    ) -> RecipeImportResult:
        first_stage_output = await self._run_image_stage1(
            image_bytes=image_bytes,
            filename=filename,
            content_type=content_type,
            context_text=context_text,
        )
        metadata = {
            "source": "image",
            "filename": filename,
            "content_type": content_type,
            "context_text": (context_text or "").strip() or None,
            "first_stage_output": first_stage_output,
        }

        try:
            recipe = await self._run_formatter_stage2(first_stage_output)
        except Exception as exc:
            raise RecipeImportStageError(str(exc), first_stage_output, metadata) from exc

        return RecipeImportResult(recipe=recipe, first_stage_output=first_stage_output, metadata=metadata)

    async def _run_text_stage1(self, text: str) -> str:
        output = await self._responses_create(
            model=self.text_extraction_model,
            input_payload=[
                {
                    "role": "system",
                    "content": TEXT_MARKDOWN_EXTRACTION_INSTRUCTIONS,
                },
                {
                    "role": "user",
                    "content": f"<recipe_text>\n{text}\n</recipe_text>",
                },
            ],
        )
        logger.debug("Recipe import text stage 1 output:\n%s", output)
        return output

    async def _run_image_stage1(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str,
        context_text: str | None = None,
    ) -> str:
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
                "image_url": self._build_data_url(image_bytes, filename, content_type),
            }
        )

        output = await self._responses_create(
            model=self.image_extraction_model,
            input_payload=[
                {
                    "role": "system",
                    "content": IMAGE_MARKDOWN_EXTRACTION_INSTRUCTIONS,
                },
                {
                    "role": "user",
                    "content": content,
                },
            ],
        )
        logger.debug("Recipe import image stage 1 output filename=%s:\n%s", filename, output)
        return output

    async def _run_formatter_stage2(self, first_stage_output: str) -> RecipeImportExtraction:
        try:
            response = await self.client.responses.parse(
                model=self.structure_model,
                input=[
                    {
                        "role": "system",
                        "content": STRUCTURED_RECIPE_INSTRUCTIONS,
                    },
                    {
                        "role": "user",
                        "content": f"<first_stage_output>\n{first_stage_output}\n</first_stage_output>",
                    },
                ],
                text_format=RecipeImportExtraction,
                temperature=0.0,
                timeout=self.timeout,
            )
        except APITimeoutError as exc:
            raise self._build_timeout_error(self.timeout) from exc

        parsed = response.output_parsed
        if parsed is None:
            raise RuntimeError("LLM returned no structured recipe output")
        return parsed

    async def _responses_create(self, model: str, input_payload: list[dict[str, Any]]) -> str:
        try:
            response = await self.client.responses.create(
                model=model,
                input=input_payload,
                temperature=0.0,
                timeout=self.timeout,
            )
            print(f"Full Response from {model}: {response}")
            print(f"Text Response from {model}: {response.output_text}")
        except APITimeoutError as exc:
            raise self._build_timeout_error(self.timeout) from exc

        output = (response.output_text or "").strip()
        if not output:
            raise RuntimeError("LLM returned no output")
        return output

    def _build_data_url(self, image_bytes: bytes, filename: str, content_type: str) -> str:
        normalized_type = _normalize_image_content_type(filename, content_type)
        encoded = base64.b64encode(image_bytes).decode("utf-8")
        return f"data:{normalized_type};base64,{encoded}"

    def _build_timeout_error(self, timeout_seconds: float) -> RuntimeError:
        return RuntimeError(
            f"LLM request timed out after {timeout_seconds:.0f}s. "
            "The model may still be too slow for this request; try a smaller image, a faster model, "
            "or increase LLM_REQUEST_TIMEOUT."
        )


def create_recipe_import_client(settings: Settings, client: AsyncOpenAI | None = None) -> RecipeImportClient:
    return RecipeImportClient(settings, client=client)
