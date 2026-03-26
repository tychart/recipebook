import asyncio
import json
import logging
import os
import time
from io import BytesIO
from typing import Any, Protocol
from urllib import error as urllib_error
from urllib import request as urllib_request

import pytesseract
from fastapi import HTTPException
from fastapi import UploadFile
from fastapi.responses import JSONResponse
from openai import OpenAI
from PIL import Image
from pydantic import BaseModel, Field

from core.config import Settings
from inference.embedding import embed_text, format_recipe_for_embedding, get_embedding_model
from schemas.auth import CurrentUser
from schemas.generate import GenerateSearchRequest, GenerateSearchResult
from schemas.job import GenerateOcrRequest, GenerateTextRequest, JobSource
from schemas.recipe import RecipeMetadata
from services.job_service import JobService
from services.recipe_service import RecipeService

logger = logging.getLogger(__name__)

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "ollama")
LLM_MODEL = os.getenv("LLM_MODEL", "lfm2.5-thinking")

OCR_PARSER_PROMPT = """
You are an expert at extracting structured data from messy OCR text.
Ignore noise and formatting errors. For ingredients, strictly separate
the numeric quantity from the unit of measurement.
"""

RAW_TEXT_PARSER_PROMPT = """
You are an expert at extracting structured recipe data from raw pasted text.
The input may include a recipe title, author, ingredient list, and instructions.
Ignore conversational filler and unrelated notes. Extract only the recipe content.
For ingredients, strictly separate the numeric quantity from the unit of measurement.
For instructions, return each step as a separate string in the correct order.
If the author is not present, return an empty string for recipe_author.
"""

if OPENAI_API_KEY == "ollama":
    llm_client = OpenAI(
        base_url=OLLAMA_URL,
        api_key="ollama",
    )
else:
    llm_client = OpenAI(api_key=OPENAI_API_KEY)


class Ingredient(BaseModel):
    name: str = Field(description="The name of the ingredient, e.g., 'all-purpose flour'")
    amount: float = Field(description="The numeric value only, e.g., 2.5")
    unit: str = Field(description="The measurement unit, e.g., 'cups', 'grams', or 'tsp'")


class RecipeExtraction(BaseModel):
    recipe_name: str
    recipe_author: str | None = Field(default="", description="The author's name, or blank if not found")
    ingredients: list[Ingredient]
    instructions: list[str]


class LLMProvider(Protocol):
    async def process_text(self, text: str) -> dict[str, Any]:
        ...

    async def process_ocr(self, payload: dict[str, Any]) -> dict[str, Any]:
        ...


class ProviderNotConfiguredError(RuntimeError):
    pass


class NoopLLMProvider:
    async def process_text(self, text: str) -> dict[str, Any]:
        raise ProviderNotConfiguredError("LLM provider is not configured")

    async def process_ocr(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise ProviderNotConfiguredError("LLM provider is not configured")


class OpenAICompatibleLLMProvider:
    def __init__(self, settings: Settings):
        if not settings.llm_base_url or not settings.llm_model:
            raise ProviderNotConfiguredError("LLM provider requires LLM_BASE_URL and LLM_MODEL")
        self.base_url = settings.llm_base_url.rstrip("/")
        self.api_key = settings.llm_api_key or "ollama"
        self.model = settings.llm_model
        self.timeout = settings.llm_request_timeout

    async def process_text(self, text: str) -> dict[str, Any]:
        prompt = (
            "Extract recipe information from the user input and return JSON with keys "
            "name, description, notes, servings, category, tags, ingredients, instructions. "
            "ingredients should be a list of objects with amount, unit, name. "
            "instructions should be a list of objects with instruction_number and instruction_text.\n\n"
            f"User input:\n{text}"
        )
        response = await self._request_chat_completion(prompt)
        return {
            "draft": self._extract_json(response),
            "provider": "openai-compatible",
        }

    async def process_ocr(self, payload: dict[str, Any]) -> dict[str, Any]:
        source = payload.get("image_url") or payload.get("filename") or "uploaded image"
        prompt = (
            "The OCR job system is wired, but OCR parsing is not implemented yet. "
            "Return JSON acknowledging the placeholder state and the source input."
        )
        response = await self._request_chat_completion(f"{prompt}\n\nSource: {source}")
        return {
            "draft": self._extract_json(response),
            "provider": "openai-compatible",
        }

    async def _request_chat_completion(self, prompt: str) -> str:
        body = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a recipe extraction assistant that returns JSON only.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ]
        }
        return await asyncio.to_thread(self._post_json, body)

    def _post_json(self, body: dict[str, Any]) -> str:
        req = urllib_request.Request(
            f"{self.base_url}/chat/completions",
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
            method="POST",
        )
        try:
            with urllib_request.urlopen(req, timeout=self.timeout) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib_error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Provider request failed: {detail or exc.reason}") from exc
        except urllib_error.URLError as exc:
            raise RuntimeError(f"Provider request failed: {exc.reason}") from exc

        choices = payload.get("choices") or []
        if not choices:
            raise RuntimeError("Provider returned no choices")
        message = choices[0].get("message") or {}
        content = message.get("content")
        if isinstance(content, list):
            return "".join(
                str(part.get("text", ""))
                for part in content
                if isinstance(part, dict)
            )
        if not isinstance(content, str):
            raise RuntimeError("Provider returned unexpected content")
        return content

    def _extract_json(self, content: str) -> dict[str, Any]:
        stripped = content.strip()
        if stripped.startswith("```"):
            stripped = stripped.strip("`")
            if "\n" in stripped:
                stripped = stripped.split("\n", 1)[1]
        if stripped.endswith("```"):
            stripped = stripped[:-3]
        try:
            return json.loads(stripped)
        except json.JSONDecodeError:
            return {"raw": content}


def create_llm_provider(settings: Settings) -> LLMProvider:
    if settings.llm_provider in {"openai", "ollama", "openai-compatible"}:
        try:
            return OpenAICompatibleLLMProvider(settings)
        except ProviderNotConfiguredError as exc:
            print(f"LLM provider configuration incomplete: {exc}")
            return NoopLLMProvider()
    return NoopLLMProvider()


class GenerateService:
    def __init__(
        self,
        job_service: JobService,
        provider: LLMProvider,
        settings: Settings,
        recipe_service: RecipeService | None = None,
    ):
        self.job_service = job_service
        self.provider = provider
        self.settings = settings
        self.recipe_service = recipe_service

    async def enqueue_text_job(self, body: GenerateTextRequest, current_user: CurrentUser):
        text = body.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Text input is required")
        return await self.job_service.enqueue(
            JobSource.text,
            {"text": text},
            owner_id=current_user.id,
        )

    async def enqueue_ocr_job(self, body: GenerateOcrRequest, current_user: CurrentUser):
        if not body.image_url and not body.image_base64:
            raise HTTPException(status_code=400, detail="Provide image_url or image_base64")
        return await self.job_service.enqueue(
            JobSource.ocr,
            {
                "image_url": body.image_url,
                "image_base64": body.image_base64,
                "filename": body.filename,
            },
            owner_id=current_user.id,
        )

    def parse_recipe_with_llm(self, system_prompt: str, raw_text: str) -> RecipeExtraction:
        response = llm_client.beta.chat.completions.parse(
            model=LLM_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {"role": "user", "content": raw_text},
            ],
            response_format=RecipeExtraction,
        )

        if not response.choices[0].message.parsed:
            raise ValueError("LLM failed to parse the recipe text.")

        return response.choices[0].message.parsed

    async def process_text_input(self, body: GenerateTextRequest):
        request_started = time.perf_counter()
        raw_text = body.text.strip()

        logger.info("Text import request received text_length=%s", len(raw_text))

        if not raw_text:
            raise HTTPException(status_code=400, detail="Text input is required")

        try:
            logger.info("Text import starting LLM parse model=%s", LLM_MODEL)
            structured_recipe = self.parse_recipe_with_llm(
                RAW_TEXT_PARSER_PROMPT,
                raw_text,
            )
            logger.info(
                "Text import LLM parse complete ingredient_count=%s instruction_count=%s duration_ms=%.2f",
                len(structured_recipe.ingredients),
                len(structured_recipe.instructions),
                (time.perf_counter() - request_started) * 1000,
            )
            return JSONResponse(content=structured_recipe.model_dump(), status_code=200)
        except Exception:
            logger.exception(
                "Text import request failed text_length=%s duration_ms=%.2f",
                len(raw_text),
                (time.perf_counter() - request_started) * 1000,
            )
            raise

    async def parse_image_with_ocr(self, image: UploadFile) -> str:
        file_name = image.filename or "<unknown>"
        content_type = image.content_type or "<unknown>"

        logger.info(
            "OCR request received filename=%s content_type=%s",
            file_name,
            content_type,
        )

        contents = await image.read()
        img = Image.open(BytesIO(contents))
        
        raw_text = pytesseract.image_to_string(
            image=img,
            output_type=pytesseract.Output.STRING
        )

        logger.info(
            "OCR text extracted filename=%s text_length=%s",
            file_name,
            len(raw_text),
        )

        logger.debug("OCR parsed text: %s", raw_text)

        return raw_text

    async def process_ocr_upload(self, image: UploadFile):
        request_started = time.perf_counter()
        file_name = image.filename or "<unknown>"
        content_type = image.content_type or "<unknown>"

        try:
            ocr_text = await self.parse_image_with_ocr(image)

            if not ocr_text.strip():
                logger.warning("OCR produced no text filename=%s", file_name)
                return JSONResponse(content={"error": "No text detected in image"}, status_code=400)

            logger.info("OCR starting LLM parse filename=%s model=%s", file_name, LLM_MODEL)
            
            structured_recipe = self.parse_recipe_with_llm(
                OCR_PARSER_PROMPT,
                ocr_text
            )
            
            logger.info(
                "OCR LLM parse complete filename=%s ingredient_count=%s instruction_count=%s duration_ms=%.2f",
                file_name,
                len(structured_recipe.ingredients),
                len(structured_recipe.instructions),
                (time.perf_counter() - request_started) * 1000,
            )

            return JSONResponse(content=structured_recipe.model_dump(), status_code=200)

        except Exception:
            logger.exception(
                "OCR request failed filename=%s content_type=%s duration_ms=%.2f",
                file_name,
                content_type,
                (time.perf_counter() - request_started) * 1000,
            )
            raise

    def _present_search_result(self, result: GenerateSearchResult) -> GenerateSearchResult:
        if self.recipe_service is None or not result.image_url:
            return result

        return result.model_copy(
            update={"image_url": self.recipe_service.storage_service.build_presigned_get_url(result.image_url)}
        )

    async def process_search_query(
        self,
        body: GenerateSearchRequest,
        current_user: CurrentUser,
    ) -> list[GenerateSearchResult]:
        query = body.query.strip()
        if not query:
            raise HTTPException(status_code=400, detail="Search query is required")

        if self.recipe_service is None:
            raise HTTPException(status_code=500, detail="Recipe service is not available")

        embedding = await self.embed_string(get_embedding_model(), query)
        results = await self.recipe_service.recipe_repo.search_semantic_recipes_for_user(
            current_user.id,
            embedding,
            body.limit,
        )
        return [self._present_search_result(result) for result in results]

    async def embed_string(self, model: str, text: str) -> list[float]:
        return await embed_text(text, model=model)

    async def embed_all_recipes(self) -> int:
        if self.recipe_service is None:
            raise HTTPException(status_code=500, detail="Recipe service is not available")
        return await self.recipe_service.backfill_missing_embeddings()

    async def embed_recipe(self, recipe_id: int) -> bool:
        if self.recipe_service is None:
            raise HTTPException(status_code=500, detail="Recipe service is not available")
        return await self.recipe_service.refresh_recipe_embedding(recipe_id)

    async def reembed_user_recipes(self, current_user: CurrentUser) -> dict[str, int]:
        if self.recipe_service is None:
            raise HTTPException(status_code=500, detail="Recipe service is not available")
        return await self.recipe_service.reembed_recipes_for_user(current_user)

    async def list_jobs(self, current_user: CurrentUser):
        return await self.job_service.list_jobs(owner_id=current_user.id)

    async def get_job(self, job_id: str, current_user: CurrentUser):
        return await self.job_service.get_job(job_id, owner_id=current_user.id)

    async def get_debug_recipe(self, recipe_id: int = 1):
        if self.recipe_service is None:
            raise HTTPException(status_code=500, detail="Recipe service is not available")

        recipe = await self.recipe_service.get_recipe(recipe_id)
        logger.debug("Debug recipe loaded recipe_id=%s", recipe_id)
        logger.debug("Formatted recipe: %s", format_recipe_for_embedding(recipe))

        return recipe

    async def process_job(self, source: JobSource, payload: dict[str, Any]) -> dict[str, Any]:
        if source == JobSource.text:
            return await self.provider.process_text(payload["text"])
        if source == JobSource.ocr:
            return await self.provider.process_ocr(payload)
        raise RuntimeError(f"Unsupported job source: {source}")

    async def run_scheduled_maintenance(self) -> int:
        return await self.job_service.prune_finished_jobs(self.settings.job_retention_seconds)
