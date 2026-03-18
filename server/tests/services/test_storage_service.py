import pytest
from fastapi import HTTPException

from services.storage_service import StorageService


class DummySettings:
    s3_endpoint = "http://localhost:9000"
    s3_key = "key"
    s3_secret = "secret"
    s3_bucket = "bucket"
    s3_region = "us-east-1"


def test_generate_filename_accepts_supported_extensions():
    service = StorageService(DummySettings())
    generated = service.generate_filename("photo.png")
    assert generated.endswith(".png")


def test_generate_filename_rejects_unsupported_extensions():
    service = StorageService(DummySettings())
    with pytest.raises(HTTPException):
        service.generate_filename("recipe.txt")
