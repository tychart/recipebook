import asyncio
import datetime as dt
from dataclasses import dataclass, field
from typing import Any
import uuid

from fastapi import HTTPException

from schemas.job import JobResponse, JobSource, JobStatus


@dataclass
class JobState:
    job_id: str
    source: JobSource
    payload: dict[str, Any]
    owner_id: int | None = None
    status: JobStatus = JobStatus.queued
    created_at: dt.datetime = field(default_factory=lambda: dt.datetime.now(dt.timezone.utc))
    started_at: dt.datetime | None = None
    completed_at: dt.datetime | None = None
    result: dict[str, Any] | None = None
    error: str | None = None
    logs: list[str] = field(default_factory=list)

    def to_response(self) -> JobResponse:
        return JobResponse(
            job_id=self.job_id,
            status=self.status,
            source=self.source,
            created_at=self.created_at,
            started_at=self.started_at,
            completed_at=self.completed_at,
            result=self.result,
            error=self.error,
            logs=list(self.logs),
        )


class JobManager:
    def __init__(self):
        self.queue: asyncio.Queue[str] = asyncio.Queue()
        self.jobs: dict[str, JobState] = {}
        self._lock = asyncio.Lock()

    async def create_job(self, source: JobSource, payload: dict[str, Any], owner_id: int | None = None) -> JobResponse:
        job_id = uuid.uuid4().hex
        state = JobState(job_id=job_id, source=source, payload=payload, owner_id=owner_id)
        async with self._lock:
            self.jobs[job_id] = state
        await self.queue.put(job_id)
        return state.to_response()

    async def list_jobs(self, owner_id: int | None = None) -> list[JobResponse]:
        async with self._lock:
            jobs = sorted(
                (
                    job
                    for job in self.jobs.values()
                    if owner_id is None or job.owner_id == owner_id
                ),
                key=lambda job: job.created_at,
                reverse=True,
            )
            return [job.to_response() for job in jobs]

    async def get_job(self, job_id: str, owner_id: int | None = None) -> JobResponse:
        async with self._lock:
            state = self.jobs.get(job_id)
            if state is None or (owner_id is not None and state.owner_id != owner_id):
                raise HTTPException(status_code=404, detail="Job not found")
            return state.to_response()

    async def get_job_state(self, job_id: str) -> JobState:
        async with self._lock:
            state = self.jobs.get(job_id)
            if state is None:
                raise KeyError(job_id)
            return state

    async def mark_running(self, job_id: str, message: str | None = None) -> None:
        async with self._lock:
            state = self.jobs[job_id]
            state.status = JobStatus.running
            state.started_at = dt.datetime.now(dt.timezone.utc)
            if message:
                state.logs.append(message)

    async def mark_succeeded(self, job_id: str, result: dict[str, Any], message: str | None = None) -> None:
        async with self._lock:
            state = self.jobs[job_id]
            state.status = JobStatus.succeeded
            state.result = result
            state.completed_at = dt.datetime.now(dt.timezone.utc)
            if message:
                state.logs.append(message)

    async def mark_failed(self, job_id: str, error: str, message: str | None = None) -> None:
        async with self._lock:
            state = self.jobs[job_id]
            state.status = JobStatus.failed
            state.error = error
            state.completed_at = dt.datetime.now(dt.timezone.utc)
            if message:
                state.logs.append(message)

    async def append_log(self, job_id: str, message: str) -> None:
        async with self._lock:
            state = self.jobs[job_id]
            state.logs.append(message)

    async def prune_completed_jobs(self, max_age_seconds: int) -> int:
        cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(seconds=max_age_seconds)
        removed = 0
        async with self._lock:
            for job_id in list(self.jobs):
                job = self.jobs[job_id]
                if job.completed_at is None:
                    continue
                if job.completed_at <= cutoff:
                    del self.jobs[job_id]
                    removed += 1
        return removed


class JobService:
    def __init__(self, manager: JobManager):
        self.manager = manager

    async def enqueue(self, source: JobSource, payload: dict[str, Any], owner_id: int | None = None) -> JobResponse:
        return await self.manager.create_job(source, payload, owner_id=owner_id)

    async def list_jobs(self, owner_id: int | None = None) -> list[JobResponse]:
        return await self.manager.list_jobs(owner_id=owner_id)

    async def get_job(self, job_id: str, owner_id: int | None = None) -> JobResponse:
        return await self.manager.get_job(job_id, owner_id=owner_id)

    async def prune_finished_jobs(self, max_age_seconds: int) -> int:
        return await self.manager.prune_completed_jobs(max_age_seconds)
