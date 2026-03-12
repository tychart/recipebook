from functools import lru_cache
from pathlib import Path
import uuid

import boto3
from botocore.exceptions import ClientError, EndpointConnectionError
from fastapi import HTTPException, UploadFile

from core.config import Settings, get_settings


class StorageService:
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

    async def upload_file(self, file: UploadFile) -> dict:
        unique_name = self.generate_filename(file.filename)
        key = f"uploads/{unique_name}"
        try:
            self.client.upload_fileobj(file.file, self.settings.s3_bucket, key)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc))
        proxied_url = f"/s3/{self.settings.s3_bucket}/{key}"
        return {"key": key, "url": proxied_url}


@lru_cache(maxsize=1)
def get_storage_service() -> StorageService:
    return StorageService(get_settings())
