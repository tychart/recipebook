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

    asyncio.run(run())


def test_job_service_prunes_completed_jobs():
    async def run():
        manager = JobManager()
        service = JobService(manager)

        job = await service.enqueue(JobSource.text, {"text": "hello"})
        await manager.mark_succeeded(job.job_id, {"draft": {}}, "done")

        removed = await service.prune_finished_jobs(0)

        assert removed == 1
        with pytest.raises(HTTPException):
            await service.get_job(job.job_id)

    asyncio.run(run())
