import logging
import time
from base64 import b64decode
from typing import Any, Protocol

from fastapi import HTTPException
from fastapi import UploadFile

from core.config import Settings
from inference.embedding import embed_text, get_embedding_model
from inference.recipe_import import RecipeImportExtraction
from schemas.auth import CurrentUser
from schemas.generate import GenerateSearchRequest, GenerateSearchResult
from schemas.job import GenerateTextRequest, JobResult, JobSource
from services.job_service import JobService
from services.recipe_service import RecipeService

logger = logging.getLogger(__name__)


class RecipeImporter(Protocol):
    async def parse_text(self, text: str) -> RecipeImportExtraction:
        ...

    async def parse_image(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str,
        context_text: str | None = None,
    ) -> RecipeImportExtraction:
        ...


class GenerateService:
    def __init__(
        self,
        job_service: JobService,
        recipe_import_client: RecipeImporter,
        settings: Settings,
        recipe_service: RecipeService | None = None,
    ):
        self.job_service = job_service
        self.recipe_import_client = recipe_import_client
        self.settings = settings
        self.recipe_service = recipe_service

    def _recipe_extraction_to_draft(self, structured_recipe: RecipeImportExtraction) -> dict[str, Any]:
        return {
            "name": structured_recipe.name.strip() or "Imported Recipe",
            "description": structured_recipe.description.strip(),
            "servings": max(1, structured_recipe.servings),
            "instructions": [step.strip() for step in structured_recipe.instructions if step.strip()],
            "notes": structured_recipe.notes.strip(),
            "ingredients": [
                {
                    "name": ingredient.name.strip(),
                    "amount": ingredient.amount,
                    "unit": ingredient.unit.strip(),
                }
                for ingredient in structured_recipe.ingredients
                if ingredient.name.strip()
            ],
            "category": structured_recipe.category.strip() or "Main",
            "tags": [tag.strip() for tag in structured_recipe.tags if tag.strip()],
        }

    async def enqueue_text_job(self, body: GenerateTextRequest, current_user: CurrentUser):
        if not body.text.strip():
            raise HTTPException(status_code=400, detail="Text input is required")
        return await self.job_service.enqueue(
            JobSource.text,
            {"text": body.text},
            owner_id=current_user.id,
        )

    async def enqueue_image_upload(
        self,
        image: UploadFile,
        current_user: CurrentUser,
        context_text: str | None = None,
    ):
        contents = await image.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Image upload is required")

        normalized_context = context_text if context_text and context_text.strip() else None
        return await self.job_service.enqueue(
            JobSource.image,
            {
                "image_bytes": contents,
                "filename": image.filename or "<unknown>",
                "content_type": image.content_type or "application/octet-stream",
                "context_text": normalized_context,
            },
            owner_id=current_user.id,
        )

    async def run_text_job(self, payload: dict[str, Any]) -> JobResult:
        request_started = time.perf_counter()
        raw_text = str(payload.get("text", ""))

        logger.info("Text import job received text_length=%s", len(raw_text))
        if not raw_text.strip():
            raise RuntimeError("Text input is required")

        try:
            logger.info("Text import starting Responses API parse")
            structured_recipe = await self.recipe_import_client.parse_text(raw_text)
            logger.info(
                "Text import parse complete ingredient_count=%s instruction_count=%s duration_ms=%.2f",
                len(structured_recipe.ingredients),
                len(structured_recipe.instructions),
                (time.perf_counter() - request_started) * 1000,
            )
            return JobResult(
                draft=self._recipe_extraction_to_draft(structured_recipe),
                raw_text=raw_text,
                metadata={
                    "source": JobSource.text.value,
                    "transcription": structured_recipe.transcription,
                },
            )
        except Exception:
            logger.exception(
                "Text import job failed text_length=%s duration_ms=%.2f",
                len(raw_text),
                (time.perf_counter() - request_started) * 1000,
            )
            raise

    def _build_image_raw_text(self, context_text: str | None, transcription: str) -> str:
        sections: list[str] = []
        if context_text and context_text.strip():
            sections.append(f"User context:\n{context_text}")
            sections.append(f"Image transcription:\n{transcription}")
            return "\n\n".join(sections)
        return transcription

    async def run_image_job(self, payload: dict[str, Any]) -> JobResult:
        request_started = time.perf_counter()
        file_name = str(payload.get("filename") or "<unknown>")
        content_type = str(payload.get("content_type") or "<unknown>")
        context_text = payload.get("context_text")
        if context_text is not None and not isinstance(context_text, str):
            context_text = str(context_text)
        image_bytes = payload.get("image_bytes")

        if isinstance(image_bytes, str):
            image_bytes = b64decode(image_bytes)
        if not isinstance(image_bytes, (bytes, bytearray)) or not image_bytes:
            raise RuntimeError("Image payload is missing")

        try:
            logger.info("Image import starting Responses API parse filename=%s", file_name)
            structured_recipe = await self.recipe_import_client.parse_image(
                bytes(image_bytes),
                file_name,
                content_type,
                context_text,
            )
            transcription = structured_recipe.transcription.strip()
            if not transcription:
                raise RuntimeError("Model returned no transcription for the image")
            logger.info(
                "Image import parse complete filename=%s ingredient_count=%s instruction_count=%s duration_ms=%.2f",
                file_name,
                len(structured_recipe.ingredients),
                len(structured_recipe.instructions),
                (time.perf_counter() - request_started) * 1000,
            )
            return JobResult(
                draft=self._recipe_extraction_to_draft(structured_recipe),
                raw_text=self._build_image_raw_text(context_text, transcription),
                metadata={
                    "source": JobSource.image.value,
                    "filename": file_name,
                    "content_type": content_type,
                    "context_text": context_text,
                    "transcription": transcription,
                },
            )
        except Exception:
            logger.exception(
                "Image import job failed filename=%s content_type=%s duration_ms=%.2f",
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

    async def retry_job(self, job_id: str, current_user: CurrentUser):
        return await self.job_service.retry_job(job_id, owner_id=current_user.id)

    async def process_job(self, source: JobSource, payload: dict[str, Any]) -> JobResult:
        if source == JobSource.text:
            return await self.run_text_job(payload)
        if source == JobSource.image:
            return await self.run_image_job(payload)
        raise RuntimeError(f"Unsupported job source: {source}")

    async def run_scheduled_maintenance(self) -> int:
        removed = await self.job_service.prune_finished_jobs(self.settings.job_retention_seconds)
        if removed:
            logger.info("Pruned completed jobs count=%s", removed)
        return removed
