import asyncio
from unittest.mock import AsyncMock

from fastapi import HTTPException

from core.config import Settings
from inference.recipe_import import ImportedIngredient, RecipeImportExtraction, RecipeImportResult, RecipeImportStageError
from schemas.auth import CurrentUser
from schemas.generate import GenerateSearchRequest
from schemas.job import GenerateTextRequest, JobSource, JobStatus
from services.generate_service import GenerateService, JobProcessingError
from services.job_service import JobManager, JobService
from workers.job_worker import worker_loop


class FakeRecipeImportClient:
    async def parse_text(self, text: str) -> RecipeImportResult:
        return RecipeImportResult(
            recipe=RecipeImportExtraction(
                name="Brownies",
                description="",
                notes="",
                servings=8,
                category="Dessert",
                tags=["sweet"],
                ingredients=[ImportedIngredient(name="sugar", amount=1, unit="cup")],
                instructions=["Mix"],
            ),
            intermediate_markdown="# Recipe\nTitle: Brownies\n\n## Ingredients\n- 1 cup sugar\n\n## Instructions\n1. Mix",
            metadata={
                "source": "text",
                "original_text": text,
            },
        )

    async def parse_image(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str,
        context_text: str | None = None,
    ) -> RecipeImportResult:
        return RecipeImportResult(
            recipe=RecipeImportExtraction(
                name="Brownies",
                description="",
                notes="",
                servings=8,
                category="Dessert",
                tags=["sweet"],
                ingredients=[ImportedIngredient(name="sugar", amount=1, unit="cup")],
                instructions=["Mix"],
            ),
            intermediate_markdown="# Recipe\nTitle: Brownies\n\n## Ingredients\n- 1 cup sugar\n\n## Instructions\n1. Mix",
            metadata={
                "source": "image",
                "filename": filename,
                "content_type": content_type,
                "context_text": context_text,
                "image_transcription": "Brownies\n1 cup sugar\nMix",
            },
        )


def make_settings() -> Settings:
    return Settings(
        database_url="postgresql://localhost/test",
        cors_origins=("http://localhost:5173",),
        s3_endpoint="http://localhost:9000",
        s3_public_endpoint="http://localhost:9000",
        s3_key=None,
        s3_secret=None,
        s3_bucket="recipe-images",
        s3_region="us-east-1",
        llm_base_url="http://localhost:11434/v1",
        llm_api_key="ollama",
        image_extraction_model="qwen3-vl:4b",
        text_extraction_model="qwen3:4b",
        structure_model="qwen3:4b",
        embedding_model=None,
        embedding_vector_size=1536,
        llm_request_timeout=60.0,
        queue_worker_count=1,
        scheduler_interval_seconds=60,
        job_retention_seconds=3600,
    )


def test_generate_service_enqueues_text_job_without_stripping_original_text():
    async def run():
        service = GenerateService(JobService(JobManager()), FakeRecipeImportClient(), make_settings())

        class User:
            id = 7

        job = await service.enqueue_text_job(GenerateTextRequest(text="  Brownies  "), User())

        assert job.source == JobSource.text
        assert job.status == JobStatus.queued
        stored = await service.job_service.get_job(job.job_id, owner_id=7)
        assert stored.result is None

    asyncio.run(run())


def test_generate_service_enqueues_image_job_with_optional_context():
    async def run():
        service = GenerateService(JobService(JobManager()), FakeRecipeImportClient(), make_settings())

        class User:
            id = 7

        upload = type(
            "UploadStub",
            (),
            {
                "filename": "brownies.png",
                "content_type": "image/png",
                "read": AsyncMock(return_value=b"png-bytes"),
            },
        )()

        job = await service.enqueue_image_upload(upload, User(), "Use the title Cosmic Brownies")

        assert job.source == JobSource.image
        assert job.status == JobStatus.queued

    asyncio.run(run())


def test_worker_marks_job_failed_after_automatic_retry(monkeypatch):
    async def run():
        manager = JobManager()
        job_service = JobService(manager)
        service = GenerateService(job_service, FakeRecipeImportClient(), make_settings())
        job = await job_service.enqueue(JobSource.text, {"text": "Brownies"})
        monkeypatch.setattr(
            service,
            "run_text_job",
            AsyncMock(side_effect=RuntimeError("llm exploded")),
        )

        task = asyncio.create_task(worker_loop(manager, service, "test-worker"))
        await manager.queue.join()
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)

        stored = await job_service.get_job(job.job_id)

        assert stored.status == JobStatus.failed
        assert stored.error == "llm exploded"
        assert any("Automatic retry scheduled" in log for log in stored.logs)

    asyncio.run(run())


def test_worker_persists_partial_result_after_stage_two_failure(monkeypatch):
    async def run():
        manager = JobManager()
        job_service = JobService(manager)
        service = GenerateService(job_service, FakeRecipeImportClient(), make_settings())
        job = await job_service.enqueue(JobSource.text, {"text": "Brownies"})
        failure = JobProcessingError(
            "Formatter exploded",
            partial_result=service._build_partial_failure_result(
                "# Recipe\nTitle: Brownies\n\n## Ingredients\n- 1 cup sugar\n\n## Instructions\n1. Mix",
                {
                    "source": "text",
                    "original_text": "Brownies",
                },
            ),
        )
        monkeypatch.setattr(service, "run_text_job", AsyncMock(side_effect=failure))

        task = asyncio.create_task(worker_loop(manager, service, "test-worker"))
        await manager.queue.join()
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)

        stored = await job_service.get_job(job.job_id)

        assert stored.status == JobStatus.failed
        assert stored.error == "Formatter exploded"
        assert stored.result is not None
        assert stored.result.raw_text.startswith("# Recipe")
        assert stored.result.metadata == {
            "source": "text",
            "original_text": "Brownies",
        }
        assert any("captured intermediate recipe markdown" in log for log in stored.logs)

    asyncio.run(run())


def test_run_text_job_returns_error_when_text_is_blank():
    async def run():
        service = GenerateService(JobService(JobManager()), FakeRecipeImportClient(), make_settings())

        try:
            await service.run_text_job({"text": "   "})
        except RuntimeError as exc:
            assert str(exc) == "Text input is required"
            return

        raise AssertionError("Expected RuntimeError for blank text")

    asyncio.run(run())


def test_run_text_job_returns_intermediate_markdown_and_original_text_metadata():
    async def run():
        service = GenerateService(JobService(JobManager()), FakeRecipeImportClient(), make_settings())

        response = await service.run_text_job({"text": "  Brownies\n1 cup sugar\nMix  "})

        assert response.draft["name"] == "Brownies"
        assert response.draft["category"] == "Dessert"
        assert response.raw_text == "# Recipe\nTitle: Brownies\n\n## Ingredients\n- 1 cup sugar\n\n## Instructions\n1. Mix"
        assert response.metadata == {
            "source": "text",
            "original_text": "  Brownies\n1 cup sugar\nMix  ",
        }

    asyncio.run(run())


def test_run_image_job_returns_intermediate_markdown_and_metadata():
    async def run():
        service = GenerateService(JobService(JobManager()), FakeRecipeImportClient(), make_settings())

        response = await service.run_image_job(
            {
                "image_bytes": b"png-bytes",
                "filename": "brownies.png",
                "content_type": "image/png",
                "context_text": "Title should be Cosmic Brownies",
            }
        )

        assert response.draft["name"] == "Brownies"
        assert response.raw_text == "# Recipe\nTitle: Brownies\n\n## Ingredients\n- 1 cup sugar\n\n## Instructions\n1. Mix"
        assert response.metadata == {
            "source": "image",
            "filename": "brownies.png",
            "content_type": "image/png",
            "context_text": "Title should be Cosmic Brownies",
            "image_transcription": "Brownies\n1 cup sugar\nMix",
        }

    asyncio.run(run())


def test_run_image_job_requires_image_payload():
    async def run():
        service = GenerateService(JobService(JobManager()), FakeRecipeImportClient(), make_settings())

        try:
            await service.run_image_job({"image_bytes": b""})
        except RuntimeError as exc:
            assert str(exc) == "Image payload is missing"
            return

        raise AssertionError("Expected RuntimeError for missing image payload")

    asyncio.run(run())


def test_run_text_job_wraps_stage_two_failure_with_partial_result():
    async def run():
        client = FakeRecipeImportClient()
        client.parse_text = AsyncMock(
            side_effect=RecipeImportStageError(
                "Formatter exploded",
                "# Recipe\nTitle: Brownies\n\n## Ingredients\n- 1 cup sugar\n\n## Instructions\n1. Mix",
                {
                    "source": "text",
                    "original_text": "Brownies",
                },
            )
        )
        service = GenerateService(JobService(JobManager()), client, make_settings())

        try:
            await service.run_text_job({"text": "Brownies"})
        except JobProcessingError as exc:
            assert str(exc) == "Formatter exploded"
            assert exc.partial_result is not None
            assert exc.partial_result.raw_text.startswith("# Recipe")
            assert exc.partial_result.metadata == {
                "source": "text",
                "original_text": "Brownies",
            }
            return

        raise AssertionError("Expected JobProcessingError for failed structuring stage")

    asyncio.run(run())


def test_process_search_query_requires_non_blank_query():
    async def run():
        service = GenerateService(JobService(JobManager()), FakeRecipeImportClient(), make_settings())
        current_user = CurrentUser(id=7, username="chef", email="chef@example.com")

        try:
            await service.process_search_query(GenerateSearchRequest(query="   ", limit=5), current_user)
        except HTTPException as exc:
            assert exc.status_code == 400
            assert exc.detail == "Search query is required"
            return

        raise AssertionError("Expected HTTPException for blank search query")

    asyncio.run(run())


def test_process_search_query_embeds_then_searches(monkeypatch):
    async def run():
        fake_repo = type(
            "RepoStub",
            (),
            {
                "search_semantic_recipes_for_user": AsyncMock(
                    return_value=[
                        type(
                            "SearchResultStub",
                            (),
                            {
                                "image_url": "recipes/1/brownies.png",
                                "model_copy": lambda self, update: {
                                    "recipe_id": 1,
                                    "recipe_name": "Brownies",
                                    "cookbook_id": 3,
                                    "cookbook_name": "Dessert Vault",
                                    "image_url": update["image_url"],
                                    "category": "Dessert",
                                    "tags": ["sweet"],
                                    "score": 0.98,
                                },
                            },
                        )()
                    ]
                )
            },
        )()
        fake_storage = type(
            "StorageStub",
            (),
            {"build_presigned_get_url": lambda self, key: f"http://public.example/{key}?signed=1"},
        )()
        fake_recipe_service = type(
            "RecipeServiceStub",
            (),
            {"recipe_repo": fake_repo, "storage_service": fake_storage},
        )()
        service = GenerateService(
            JobService(JobManager()),
            FakeRecipeImportClient(),
            make_settings(),
            fake_recipe_service,
        )
        current_user = CurrentUser(id=7, username="chef", email="chef@example.com")
        embed_mock = AsyncMock(return_value=[0.1] * 1536)

        monkeypatch.setattr(service, "embed_string", embed_mock)
        monkeypatch.setattr("services.generate_service.get_embedding_model", lambda: "embed-model")

        results = await service.process_search_query(
            GenerateSearchRequest(query="brownies", limit=5),
            current_user,
        )

        embed_mock.assert_awaited_once_with("embed-model", "brownies")
        fake_repo.search_semantic_recipes_for_user.assert_awaited_once_with(7, [0.1] * 1536, 5)
        assert results[0]["image_url"] == "http://public.example/recipes/1/brownies.png?signed=1"

    asyncio.run(run())


def test_reembed_user_recipes_delegates_to_recipe_service():
    async def run():
        fake_recipe_service = type(
            "RecipeServiceStub",
            (),
            {
                "reembed_recipes_for_user": AsyncMock(
                    return_value={"processed_count": 4, "updated_count": 4}
                )
            },
        )()
        service = GenerateService(
            JobService(JobManager()),
            FakeRecipeImportClient(),
            make_settings(),
            fake_recipe_service,
        )
        current_user = CurrentUser(id=7, username="chef", email="chef@example.com")

        result = await service.reembed_user_recipes(current_user)

        fake_recipe_service.reembed_recipes_for_user.assert_awaited_once_with(current_user)
        assert result == {"processed_count": 4, "updated_count": 4}

    asyncio.run(run())


def test_run_scheduled_maintenance_prunes_finished_jobs():
    async def run():
        manager = JobManager()
        job_service = JobService(manager)
        settings = make_settings()
        settings = Settings(
            **{
                **settings.__dict__,
                "job_retention_seconds": 0,
            }
        )
        service = GenerateService(job_service, FakeRecipeImportClient(), settings)

        job = await job_service.enqueue(JobSource.text, {"text": "hello"})
        await manager.mark_succeeded(job.job_id, {"draft": {}, "raw_text": "hello"}, "done")

        removed = await service.run_scheduled_maintenance()

        assert removed == 1

    asyncio.run(run())


def test_run_image_job_surfaces_timeout_with_clear_message():
    async def run():
        client = FakeRecipeImportClient()
        client.parse_image = AsyncMock(side_effect=RuntimeError("LLM request timed out after 300s."))
        service = GenerateService(JobService(JobManager()), client, make_settings())

        try:
            await service.run_image_job(
                {
                    "image_bytes": b"png-bytes",
                    "filename": "brownies.png",
                    "content_type": "image/png",
                }
            )
        except RuntimeError as exc:
            assert "timed out" in str(exc)
            return

        raise AssertionError("Expected RuntimeError for timed-out image import")

    asyncio.run(run())
