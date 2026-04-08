import asyncio

import pytest
from fastapi import HTTPException

from schemas.job import JobSource, JobStatus
from services.job_service import JobManager, JobService


def test_job_service_enqueues_and_lists_jobs():
    async def run():
        manager = JobManager()
        service = JobService(manager)

        job = await service.enqueue(JobSource.text, {"text": "hello"})
        jobs = await service.list_jobs()

        assert job.status == JobStatus.queued
        assert jobs[0].job_id == job.job_id
        assert jobs[0].source == JobSource.text
        detail = await service.get_job(job.job_id)
        assert detail.logs == []
        assert detail.result is None

    asyncio.run(run())


def test_job_service_prunes_completed_jobs():
    async def run():
        manager = JobManager()
        service = JobService(manager)

        job = await service.enqueue(JobSource.text, {"text": "hello"})
        await manager.mark_succeeded(job.job_id, {"draft": {}, "raw_text": "hello"}, "done")

        removed = await service.prune_finished_jobs(0)

        assert removed == 1
        with pytest.raises(HTTPException):
            await service.get_job(job.job_id)

    asyncio.run(run())


def test_job_service_manual_retry_requeues_failed_job():
    async def run():
        manager = JobManager()
        service = JobService(manager)

        job = await service.enqueue(JobSource.text, {"text": "hello"}, owner_id=7)
        await manager.mark_failed(job.job_id, "boom", "failed once")

        retried = await service.retry_job(job.job_id, owner_id=7)
        detail = await service.get_job(job.job_id, owner_id=7)

        assert retried.status == JobStatus.queued
        assert detail.status == JobStatus.queued
        assert "Manual retry requested" in detail.logs

    asyncio.run(run())
