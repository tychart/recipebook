import asyncio
import base64
import mimetypes
from typing import Any

from openai import OpenAI
from openai import APITimeoutError
from pydantic import BaseModel, ConfigDict, Field

from core.config import Settings
from inference.openai_client import create_openai_client

TEXT_IMPORT_INSTRUCTIONS = """
Extract structured recipe data from raw recipe text and return only schema-matching output.

Rules:
- Fill every required field.
- Use defaults when missing:
  - servings = 1
  - category = "Main"
  - description = ""
  - notes = ""
  - tags = []
- Ingredients:
  - amount must be a float
  - convert fractions to decimals (1/2 -> 0.5, 3/4 -> 0.75)
  - use amount = 0 if quantity is missing
  - unit should contain only the measurement unit, or ""
  - name should contain only the ingredient name
- Instructions:
  - return each step as a separate string in order
- Transcription:
  - copy the recipe text faithfully
- Return no markdown, no explanations, and no reasoning.
""".strip()

IMAGE_IMPORT_INSTRUCTIONS = """
Extract structured recipe data from a recipe image plus optional user guidance text and return only schema-matching output.

Rules:
- Fill every required field.
- Use defaults when missing:
  - servings = 1
  - category = "Main"
  - description = ""
  - notes = ""
  - tags = []
- Ingredients:
  - amount must be a float
  - convert fractions to decimals (1/2 -> 0.5, 1/4 -> 0.25, 3/4 -> 0.75)
  - use amount = 0 if quantity is missing
  - unit should contain only the measurement unit, or ""
  - name should contain only the ingredient name
- Instructions:
  - return each step as a separate string in order
- Transcription:
  - transcribe only visible recipe content from the image
  - do not include user guidance in transcription
- Exclude branding, watermarks, and unrelated page text from structured fields.
  - Include it in transcription only if it appears to be part of the recipe content.
- Return no markdown, no explanations, and no reasoning.
""".strip()

_MIN_IMAGE_TIMEOUT_SECONDS = 300.0


class ImportedIngredient(BaseModel):
    amount: float = Field(
        description=(
            "Numeric ingredient amount as a float only. "
            "Convert fractions to decimals, for example 1/2 to 0.5. "
            "Use 0 if unknown."
        )
    )
    unit: str = Field(
        default="",
        description=(
            'Measurement unit only, such as "cup", "tsp", or "". '
            "Do not include ingredient names or counts."
        ),
    )
    name: str = Field(
        description="Ingredient name only, without quantity, count, or unit."
    )

    model_config = ConfigDict(extra="forbid")


class RecipeImportExtraction(BaseModel):
    name: str = Field(description="Recipe title.")
    description: str = Field(default="", description="A short recipe description.")
    notes: str = Field(default="", description="Any helpful notes that belong on the recipe.")
    servings: int = Field(default=1, ge=1, description="Serving count. Use 1 if unknown.")
    category: str = Field(default="Main", description='Recipe category. Use "Main" if unknown.')
    tags: list[str] = Field(default_factory=list, description="Short tag labels for the recipe.")
    ingredients: list[ImportedIngredient] = Field(description="Structured ingredient list.")
    
    instructions: list[str] = Field(
        description=(
            "Ordered recipe steps as plain strings, one step per item, "
            "without leading step numbers."
        )
    )

    transcription: str = Field(description="Plain-text transcription of the visible recipe content from the source only.")

    model_config = ConfigDict(extra="forbid")


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
        return await asyncio.to_thread(
            self._parse,
            TEXT_IMPORT_INSTRUCTIONS,
            [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": text,
                        }
                    ],
                }
            ],
            self.timeout,
        )

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
                "text": "Extract a recipe from this image.",
            }
        ]

        if context_text and context_text.strip():
            content.append(
                {
                    "type": "input_text",
                    "text": (
                        "Additional user guidance for resolving ambiguous or missing "
                        f"recipe details:\n{context_text.strip()}"
                    ),
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

        return await asyncio.to_thread(
            self._parse,
            IMAGE_IMPORT_INSTRUCTIONS,
            input_payload,
            max(self.timeout, _MIN_IMAGE_TIMEOUT_SECONDS),
        )

    def _build_data_url(self, image_bytes: bytes, filename: str, content_type: str) -> str:
        normalized_type = _normalize_image_content_type(filename, content_type)
        encoded = base64.b64encode(image_bytes).decode("utf-8")
        return f"data:{normalized_type};base64,{encoded}"

    def _parse(
        self,
        instructions: str,
        input_payload: list[dict[str, Any]],
        timeout_seconds: float,
    ) -> RecipeImportExtraction:
        try:
            response = self.client.responses.parse(
                model=self.model,
                instructions=instructions,
                input=input_payload,
                text_format=RecipeImportExtraction,
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
