import asyncio
import base64
import mimetypes
from typing import Any, TypeVar

from openai import OpenAI
from openai import APITimeoutError
from pydantic import BaseModel, ConfigDict, Field

from core.config import Settings
from inference.openai_client import create_openai_client

TEXT_IMPORT_INSTRUCTIONS = """
You extract structured recipe data from plain text.

<task>
Read the recipe text and fill every response field.
</task>

<normalization>
- Defaults when absent: description="", notes="", servings=1, category="Main", tags=[].
- Ingredients: amount is a float; convert fractions to decimals; use 0 when quantity is absent; unit is measurement only or "".
- Instructions: one step per list item, in source order, without step numbers.
</normalization>

<output>
Return only the schema response.
No markdown.
No explanations.
No reasoning.
Answer directly.
</output>
""".strip()

IMAGE_IMPORT_INSTRUCTIONS = """
You extract structured recipe data from a recipe image and optional user guidance.

<task>
Use the image as the main source and fill every response field.
</task>

<user_guidance>
User guidance may clarify missing or ambiguous recipe details.
Use it only to resolve ambiguity or add missing details.
Do not treat user guidance as visible image text.
</user_guidance>

<normalization>
- Defaults when absent: description="", notes="", servings=1, category="Main", tags=[].
- Ingredients: amount is a float; convert fractions to decimals; use 0 when quantity is absent; unit is measurement only or "".
- Instructions: one step per list item, in recipe order, without step numbers.
- Transcription: include only visible recipe content from the image.
- Ignore decorative branding, watermarks, and unrelated page text unless it is part of the recipe.
</normalization>

<output>
Return only the schema response.
No markdown.
No explanations.
No reasoning.
Answer directly.
</output>
""".strip()

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


class RecipeImportFields(BaseModel):
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


class TextRecipeImportExtraction(RecipeImportFields):
    pass


class ImageRecipeImportExtraction(RecipeImportFields):
    transcription: str = Field(
        description="Plain-text transcription of visible recipe content from the image only. Do not include user guidance."
    )


class RecipeImportExtraction(RecipeImportFields):
    transcription: str = Field(
        description="Plain-text transcription shown to the user for debugging. For text imports this is the original submitted text. For image imports this is visible image-derived recipe text."
    )


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
        model = (settings.llm_model or "").strip()
        if not model:
            raise RuntimeError("LLM_MODEL is not configured")

        self.client = client or create_openai_client(settings)
        self.model = model
        self.timeout = settings.llm_request_timeout

    async def parse_text(self, text: str) -> RecipeImportExtraction:
        parsed = await asyncio.to_thread(
            self._parse,
            TEXT_IMPORT_INSTRUCTIONS,
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
            TextRecipeImportExtraction,
            self.timeout,
        )
        return RecipeImportExtraction(**parsed.model_dump(), transcription=text)

    async def parse_image(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str,
        context_text: str | None = None,
    ) -> RecipeImportExtraction:
        data_url = self._build_data_url(image_bytes, filename, content_type)

        content: list[dict[str, Any]] = [
            {
                "type": "input_text",
                "text": "<recipe_image>\nExtract the recipe from this image.\n</recipe_image>",
            }
        ]

        if context_text and context_text.strip():
            content.append(
                {
                    "type": "input_text",
                    "text": f"<user_guidance>\n{context_text.strip()}\n</user_guidance>",
                }
            )

        content.append(
            {
                "type": "input_image",
                "image_url": data_url,
            }
        )

        input_payload = [
            {
                "role": "user",
                "content": content,
            }
        ]

        parsed = await asyncio.to_thread(
            self._parse,
            IMAGE_IMPORT_INSTRUCTIONS,
            input_payload,
            ImageRecipeImportExtraction,
            max(self.timeout, _MIN_IMAGE_TIMEOUT_SECONDS),
        )
        return RecipeImportExtraction(**parsed.model_dump())

    def _build_data_url(self, image_bytes: bytes, filename: str, content_type: str) -> str:
        normalized_type = _normalize_image_content_type(filename, content_type)
        encoded = base64.b64encode(image_bytes).decode("utf-8")
        return f"data:{normalized_type};base64,{encoded}"

    def _parse(
        self,
        instructions: str,
        input_payload: list[dict[str, Any]],
        text_format: type[ParseModelT],
        timeout_seconds: float,
    ) -> ParseModelT:
        try:
            response = self.client.responses.parse(
                model=self.model,
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
