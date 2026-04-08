import os
from dataclasses import dataclass
from functools import lru_cache

# This file is for reading in the env variables and acting on them

_DEFAULT_DATABASE_URL = "postgresql://RecipeAdmin:R3c1peB00k@localhost:5432/recipebook"
_DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


@dataclass(frozen=True)
class Settings:
    database_url: str
    cors_origins: tuple[str, ...]
    s3_endpoint: str
    s3_public_endpoint: str
    s3_key: str | None
    s3_secret: str | None
    s3_bucket: str
    s3_region: str
    llm_provider: str
    llm_base_url: str | None
    llm_api_key: str | None
    llm_model: str | None
    ml_base_url: str
    ml_timeout_seconds: float
    embedding_model: str | None
    embedding_vector_size: int
    llm_request_timeout: float
    queue_worker_count: int
    scheduler_interval_seconds: int
    job_retention_seconds: int


def _parse_csv_env(name: str, default: tuple[str, ...]) -> tuple[str, ...]:
    raw = os.getenv(name)
    if raw is None:
        return default
    values = tuple(part.strip() for part in raw.split(",") if part.strip())
    return values or default


def _get_int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _get_float_env(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        database_url=os.getenv("DATABASE_URL", _DEFAULT_DATABASE_URL),
        cors_origins=_parse_csv_env("CORS_ALLOW_ORIGINS", _DEFAULT_CORS_ORIGINS),
        s3_endpoint=os.getenv("S3_ENDPOINT", "http://localhost:9000"),
        s3_public_endpoint=os.getenv("S3_PUBLIC_ENDPOINT", "http://localhost:9000"),
        s3_key=os.getenv("S3_KEY"),
        s3_secret=os.getenv("S3_SECRET"),
        s3_bucket=os.getenv("S3_BUCKET", "recipe-images"),
        s3_region=os.getenv("S3_REGION", "us-east-1"),
        llm_provider=os.getenv("LLM_PROVIDER", "").strip().lower(),
        llm_base_url=os.getenv("LLM_BASE_URL"),
        llm_api_key=os.getenv("LLM_API_KEY"),
        llm_model=os.getenv("LLM_MODEL"),
        ml_base_url=os.getenv("ML_BASE_URL", "http://localhost:8001"),
        ml_timeout_seconds=_get_float_env("ML_TIMEOUT_SECONDS", 120.0),
        embedding_model=os.getenv("EMBEDDING_MODEL"),
        embedding_vector_size=max(1, _get_int_env("EMBEDDING_VECTOR_SIZE", 1536)),
        llm_request_timeout=_get_float_env("LLM_REQUEST_TIMEOUT", 60.0),
        queue_worker_count=max(1, _get_int_env("QUEUE_WORKER_COUNT", 1)),
        scheduler_interval_seconds=max(5, _get_int_env("SCHEDULER_INTERVAL_SECONDS", 300)),
        job_retention_seconds=max(60, _get_int_env("JOB_RETENTION_SECONDS", 3600)),
    )
