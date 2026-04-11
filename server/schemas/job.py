import datetime as dt
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    queued = "queued"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"


class JobSource(str, Enum):
    text = "text"
    ocr = "ocr"


class GenerateTextRequest(BaseModel):
    text: str


class GenerateOcrRequest(BaseModel):
    image_url: str | None = None
    image_base64: str | None = None
    filename: str | None = None


class JobResult(BaseModel):
    draft: dict[str, Any]
    raw_text: str
    metadata: dict[str, Any] | None = None


class JobSummaryResponse(BaseModel):
    job_id: str
    status: JobStatus
    source: JobSource
    created_at: dt.datetime
    started_at: dt.datetime | None = None
    completed_at: dt.datetime | None = None
    error: str | None = None


class JobDetailResponse(JobSummaryResponse):
    result: JobResult | None = None
    logs: list[str] = Field(default_factory=list)
