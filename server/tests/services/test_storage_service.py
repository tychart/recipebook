import pytest
from fastapi import HTTPException

from services.storage_service import StorageService


class DummySettings:
    s3_endpoint = "http://localhost:9000"
    s3_public_endpoint = "http://public.example:9000"
    s3_key = "key"
    s3_secret = "secret"
    s3_bucket = "bucket"
    s3_region = "us-east-1"


class FakeS3Client:
    def __init__(self):
        self.deleted: list[tuple[str, str]] = []

    def generate_presigned_url(self, operation, Params, ExpiresIn):
        assert operation == "get_object"
        assert Params["Bucket"] == "bucket"
        assert ExpiresIn == StorageService.PRESIGNED_URL_TTL_SECONDS
        return (
            "http://localhost:9000/bucket/recipes/3/example.png"
            "?X-Amz-Algorithm=AWS4-HMAC-SHA256"
        )

    def delete_object(self, Bucket, Key):
        self.deleted.append((Bucket, Key))


def test_generate_filename_accepts_supported_extensions():
    service = StorageService(DummySettings())
    generated = service.generate_filename("photo.png")
    assert generated.endswith(".png")


def test_generate_filename_rejects_unsupported_extensions():
    service = StorageService(DummySettings())
    with pytest.raises(HTTPException):
        service.generate_filename("recipe.txt")


def test_generate_recipe_image_key_uses_uuid_name_and_cookbook_prefix():
    service = StorageService(DummySettings())
    key = service.generate_recipe_image_key("photo.png", cookbook_id=12)
    assert key.startswith("recipes/12/")
    assert key.endswith(".png")


def test_build_presigned_get_url_rewrites_to_public_endpoint():
    service = StorageService(DummySettings())
    service.client = FakeS3Client()
    url = service.build_presigned_get_url("recipes/3/example.png")
    assert url.startswith("http://public.example:9000/bucket/recipes/3/example.png")
    assert "X-Amz-Algorithm=" in url


def test_delete_object_is_best_effort():
    service = StorageService(DummySettings())
    client = FakeS3Client()
    service.client = client
    service.delete_object("recipes/3/example.png")
    assert client.deleted == [("bucket", "recipes/3/example.png")]
