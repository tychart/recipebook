from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse, urlunparse
import uuid

import boto3
from botocore.exceptions import ClientError, EndpointConnectionError
from fastapi import HTTPException, UploadFile

from core.config import Settings, get_settings


class StorageService:
    PRESIGNED_URL_TTL_SECONDS = 15 * 60

    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint,
            aws_access_key_id=settings.s3_key,
            aws_secret_access_key=settings.s3_secret,
            region_name=settings.s3_region,
        )

    def ensure_bucket_exists(self) -> None:
        if self.settings.s3_key is None or self.settings.s3_secret is None:
            print(
                "S3 credentials are missing, are you sure that you defined S3_KEY and S3_SECRET? "
                "Also are you sure that you are importing your .env file properly? "
                "(uvicorn main:app --env-file ../.env --reload)"
            )
            return

        try:
            self.client.head_bucket(Bucket=self.settings.s3_bucket)
        except ClientError:
            self.client.create_bucket(Bucket=self.settings.s3_bucket)
        except EndpointConnectionError:
            print(
                f"WARNING: Could not reach S3 at {self.settings.s3_endpoint}. "
                "App will start but image uploads will fail."
            )

    def generate_filename(self, original_name: str | None) -> str:
        name = original_name or "upload"
        ext = Path(name).suffix.lower()
        allowed_exts = {".jpg", ".jpeg", ".png", ".webp"}
        if ext not in allowed_exts:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        return f"{uuid.uuid4().hex}{ext}"

    def generate_recipe_image_key(self, original_name: str | None, cookbook_id: int | None = None) -> str:
        unique_name = self.generate_filename(original_name)
        if cookbook_id is None:
            return f"recipes/{unique_name}"
        return f"recipes/{cookbook_id}/{unique_name}"

    def build_presigned_get_url(self, key: str) -> str:
        try:
            signed_url = self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.settings.s3_bucket, "Key": key},
                ExpiresIn=self.PRESIGNED_URL_TTL_SECONDS,
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc))
        return self._rewrite_public_url(signed_url)

    def _rewrite_public_url(self, signed_url: str) -> str:
        signed_parts = urlparse(signed_url)
        public_parts = urlparse(self.settings.s3_public_endpoint)
        scheme = public_parts.scheme or signed_parts.scheme
        netloc = public_parts.netloc or signed_parts.netloc
        path_prefix = public_parts.path.rstrip("/")
        path = signed_parts.path
        if path_prefix:
            path = f"{path_prefix}{path}"
        return urlunparse(
            (
                scheme,
                netloc,
                path,
                signed_parts.params,
                signed_parts.query,
                signed_parts.fragment,
            )
        )

    async def upload_recipe_image(self, file: UploadFile, cookbook_id: int | None = None) -> str:
        key = self.generate_recipe_image_key(file.filename, cookbook_id)
        try:
            self.client.upload_fileobj(
                file.file,
                self.settings.s3_bucket,
                key,
                ExtraArgs={"ContentType": file.content_type or "application/octet-stream"},
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc))
        return key

    def delete_object(self, key: str) -> None:
        try:
            self.client.delete_object(Bucket=self.settings.s3_bucket, Key=key)
        except Exception:
            # Best-effort cleanup only; callers should not fail the primary request on deletion issues.
            return

    async def upload_file(self, file: UploadFile) -> dict:
        key = f"uploads/{self.generate_filename(file.filename)}"
        try:
            self.client.upload_fileobj(
                file.file,
                self.settings.s3_bucket,
                key,
                ExtraArgs={"ContentType": file.content_type or "application/octet-stream"},
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc))
        return {"key": key, "url": self.build_presigned_get_url(key)}


@lru_cache(maxsize=1)
def get_storage_service() -> StorageService:
    return StorageService(get_settings())
