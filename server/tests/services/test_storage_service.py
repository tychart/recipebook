import pytest
from botocore.exceptions import ClientError
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


class BucketCheckClient:
    def __init__(self, exc: Exception | None = None):
        self.exc = exc
        self.created_bucket: str | None = None

    def head_bucket(self, Bucket):
        if self.exc is not None:
            raise self.exc

    def create_bucket(self, Bucket):
        self.created_bucket = Bucket


def make_client_error(code: str, status_code: int) -> ClientError:
    return ClientError(
        {
            "Error": {"Code": code, "Message": code},
            "ResponseMetadata": {"HTTPStatusCode": status_code},
        },
        "HeadBucket",
    )


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


def test_ensure_bucket_exists_creates_bucket_when_missing():
    service = StorageService(DummySettings())
    client = BucketCheckClient(exc=make_client_error("NoSuchBucket", 404))
    service.client = client

    service.ensure_bucket_exists()

    assert client.created_bucket == "bucket"


def test_ensure_bucket_exists_does_not_create_bucket_on_forbidden():
    service = StorageService(DummySettings())
    client = BucketCheckClient(exc=make_client_error("403", 403))
    service.client = client

    service.ensure_bucket_exists()

    assert client.created_bucket is None
