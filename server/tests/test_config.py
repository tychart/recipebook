from pathlib import Path

import pytest

from core.config import Settings, get_settings


def test_settings_require_all_recipe_import_models():
    with pytest.raises(ValueError, match="IMAGE_EXTRACTION_MODEL is not configured"):
        Settings(
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
            image_extraction_model=None,
            text_extraction_model="qwen3:4b",
            structure_model="qwen3:4b",
            embedding_model=None,
            embedding_vector_size=1536,
            llm_request_timeout=60.0,
            queue_worker_count=1,
            scheduler_interval_seconds=60,
            job_retention_seconds=3600,
        )


def test_get_settings_reads_stage_specific_model_env_vars(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("IMAGE_EXTRACTION_MODEL", "qwen3-vl:4b")
    monkeypatch.setenv("TEXT_EXTRACTION_MODEL", "qwen3:4b")
    monkeypatch.setenv("STRUCTURE_MODEL", "qwen3:4b")

    settings = get_settings()

    assert settings.image_extraction_model == "qwen3-vl:4b"
    assert settings.text_extraction_model == "qwen3:4b"
    assert settings.structure_model == "qwen3:4b"

    get_settings.cache_clear()


def test_env_example_documents_stage_specific_models():
    env_example = Path(__file__).resolve().parents[2] / ".env.example"
    contents = env_example.read_text(encoding="utf-8")

    assert "IMAGE_EXTRACTION_MODEL=" in contents
    assert "TEXT_EXTRACTION_MODEL=" in contents
    assert "STRUCTURE_MODEL=" in contents
    assert "LLM_MODEL=" not in contents
