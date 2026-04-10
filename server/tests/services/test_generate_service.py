import asyncio
from unittest.mock import AsyncMock

from fastapi import HTTPException

from core.config import Settings
from schemas.auth import CurrentUser
from schemas.generate import GenerateSearchRequest
from schemas.job import GenerateTextRequest, JobSource, JobStatus
from services.generate_service import GenerateService, NoopLLMProvider
from services.job_service import JobManager, JobService
from workers.job_worker import worker_loop


class FakeProvider:
    async def process_text(self, text: str):
        return {"draft": {"name": text}}

    async def process_ocr(self, payload):
        return {"draft": {"source": payload.get("image_url")}}


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
        llm_provider="",
        llm_base_url=None,
        llm_api_key=None,
        llm_model=None,
        embedding_model=None,
        embedding_vector_size=1536,
        llm_request_timeout=60.0,
        queue_worker_count=1,
        scheduler_interval_seconds=60,
        job_retention_seconds=3600,
    )


def test_generate_service_enqueues_text_job():
    async def run():
        service = GenerateService(JobService(JobManager()), FakeProvider(), make_settings())

        class User:
            id = 7

        job = await service.enqueue_text_job(GenerateTextRequest(text="Brownies"), User())

        assert job.source == JobSource.text
        assert job.status == JobStatus.queued

    asyncio.run(run())


def test_generate_service_enqueues_ocr_job():
    async def run():
        service = GenerateService(JobService(JobManager()), FakeProvider(), make_settings())

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

        job = await service.enqueue_ocr_upload(upload, User())

        assert job.source == JobSource.ocr
        assert job.status == JobStatus.queued

    asyncio.run(run())


def test_worker_marks_job_failed_after_automatic_retry(monkeypatch):
    async def run():
        manager = JobManager()
        job_service = JobService(manager)
        service = GenerateService(job_service, NoopLLMProvider(), make_settings())
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


def test_run_text_job_returns_400_when_text_is_blank():
    async def run():
        service = GenerateService(JobService(JobManager()), FakeProvider(), make_settings())

        try:
            await service.run_text_job({"text": "   "})
        except RuntimeError as exc:
            assert str(exc) == "Text input is required"
            return

        raise AssertionError("Expected RuntimeError for blank text")

    asyncio.run(run())


def test_run_text_job_returns_parsed_recipe(monkeypatch):
    async def run():
        service = GenerateService(JobService(JobManager()), FakeProvider(), make_settings())

        monkeypatch.setattr(
            service,
            "parse_recipe_with_llm",
            AsyncMock(
                return_value=type(
                    "RecipeExtractionStub",
                    (),
                    {
                        "ingredients": [type("IngredientStub", (), {"name": "sugar", "amount": 1, "unit": "cup"})()],
                        "instructions": ["Mix"],
                        "recipe_name": "Brownies",
                        "recipe_author": "Grandma",
                    },
                )()
            ),
        )

        response = await service.run_text_job({"text": "Brownies\n1 cup sugar\nMix"})

        assert response.draft["name"] == "Brownies"
        assert response.draft["notes"] == "Imported author: Grandma"
        assert response.raw_text == "Brownies\n1 cup sugar\nMix"

    asyncio.run(run())


def test_process_search_query_requires_non_blank_query():
    async def run():
        service = GenerateService(JobService(JobManager()), FakeProvider(), make_settings())
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
            FakeProvider(),
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
            FakeProvider(),
            make_settings(),
            fake_recipe_service,
        )
        current_user = CurrentUser(id=7, username="chef", email="chef@example.com")

        result = await service.reembed_user_recipes(current_user)

        fake_recipe_service.reembed_recipes_for_user.assert_awaited_once_with(current_user)
        assert result == {"processed_count": 4, "updated_count": 4}

    asyncio.run(run())
