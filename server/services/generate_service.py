import asyncio
import json
from typing import Any, Protocol
from urllib import error as urllib_error
from urllib import request as urllib_request

from fastapi import HTTPException

from core.config import Settings
from schemas.auth import CurrentUser
from schemas.job import GenerateOcrRequest, GenerateTextRequest, JobSource
from schemas.recipe import RecipeMetadata
from services.job_service import JobService
from services.recipe_service import RecipeService


def format_recipe_for_embedding(recipe: RecipeMetadata) -> str:
    parts: list[str] = [f"Title: {recipe.name}"]
    if recipe.description:
        parts.append(f"Description: {recipe.description}")
    if recipe.notes:
        parts.append(f"Notes: {recipe.notes}")
    parts.append(f"Category: {recipe.category}")
    parts.append(f"Servings: {recipe.servings}")
    if recipe.tags:
        parts.append("Tags: " + ", ".join(recipe.tags))

    ingredient_lines: list[str] = []
    for ingredient in recipe.ingredients:
        amount = f"{ingredient.amount:g}" if ingredient.amount is not None else ""
        unit = f" {ingredient.unit}" if ingredient.unit else ""
        ingredient_lines.append(f"- {amount}{unit} {ingredient.name}".strip())
    if ingredient_lines:
        parts.append("Ingredients:\n" + "\n".join(ingredient_lines))

    sorted_instructions = sorted(recipe.instructions, key=lambda item: item.instruction_number)
    if sorted_instructions:
        parts.append(
            "Instructions:\n"
            + "\n".join(
                f"{instruction.instruction_number}. {instruction.instruction_text}"
                for instruction in sorted_instructions
            )
        )

    # if recipe.creator_id is not None:
    #     parts.append(f"CreatorID: {recipe.creator_id}")
    # parts.append(f"CookbookID: {recipe.cookbook_id}")
    return "\n\n".join(parts)


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
            ],
            "temperature": 0.2,
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

    async def list_jobs(self, current_user: CurrentUser):
        return await self.job_service.list_jobs(owner_id=current_user.id)

    async def get_job(self, job_id: str, current_user: CurrentUser):
        return await self.job_service.get_job(job_id, owner_id=current_user.id)

    async def get_debug_recipe(self, recipe_id: int = 1):
        if self.recipe_service is None:
            raise HTTPException(status_code=500, detail="Recipe service is not available")

        recipe = await self.recipe_service.get_recipe(recipe_id)
        
        print(recipe)

        print("Formatted recipe: ==============")
        print(format_recipe_for_embedding(recipe))

        return recipe

    async def process_job(self, source: JobSource, payload: dict[str, Any]) -> dict[str, Any]:
        if source == JobSource.text:
            return await self.provider.process_text(payload["text"])
        if source == JobSource.ocr:
            return await self.provider.process_ocr(payload)
        raise RuntimeError(f"Unsupported job source: {source}")

    async def run_scheduled_maintenance(self) -> int:
        return await self.job_service.prune_finished_jobs(self.settings.job_retention_seconds)
