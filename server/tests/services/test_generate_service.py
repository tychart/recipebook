import asyncio
from io import BytesIO

from fastapi import UploadFile

from core.config import Settings
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


def test_worker_marks_job_failed_when_provider_is_missing():
    async def run():
        manager = JobManager()
        job_service = JobService(manager)
        service = GenerateService(job_service, NoopLLMProvider(), make_settings())
        job = await job_service.enqueue(JobSource.text, {"text": "Brownies"})

        task = asyncio.create_task(worker_loop(manager, service, "test-worker"))
        await manager.queue.join()
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)

        stored = await job_service.get_job(job.job_id)
        assert stored.status == JobStatus.failed
        assert "not configured" in (stored.error or "").lower()

    asyncio.run(run())


def test_process_ocr_upload_returns_400_when_no_text_detected(monkeypatch):
    async def run():
        service = GenerateService(JobService(JobManager()), FakeProvider(), make_settings())

        monkeypatch.setattr("services.generate_service.Image.open", lambda _: type("ImageStub", (), {"format": "PNG", "width": 1, "height": 1})())
        monkeypatch.setattr("services.generate_service.pytesseract.image_to_string", lambda _: "   ")

        upload = UploadFile(filename="empty.png", file=BytesIO(b"fake-image"))

        response = await service.process_ocr_upload(upload)

        assert response.status_code == 400
        assert response.body == b'{"error":"No text detected in image"}'

    asyncio.run(run())
