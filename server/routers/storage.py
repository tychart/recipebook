# server/uploads.py
from pathlib import Path
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException
import boto3, os

from botocore.exceptions import ClientError, EndpointConnectionError

router = APIRouter(
    prefix="/api/uploads",
    tags=["storage"],
)

# S3_ENDPOINT should point at the RustFS/S3 API.
# - In docker-compose: use http://recipebook-rustfs:9000
# - In local dev (uvicorn on host): use http://localhost:9000
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localhost:9000")
S3_KEY = os.getenv("S3_KEY")
S3_SECRET = os.getenv("S3_SECRET")
S3_BUCKET = os.getenv("S3_BUCKET", "recipe-images")
S3_REGION = os.getenv("S3_REGION", "us-east-1")

s3 = boto3.client(
    "s3",
    endpoint_url=S3_ENDPOINT,  # None if using AWS
    aws_access_key_id=S3_KEY,
    aws_secret_access_key=S3_SECRET,
    region_name=S3_REGION,
)

def ensure_bucket_exists():

    # These are just for debugging purposes,
    # comment out/delete after you are done
    print(f"S3_ENDPOINT: {S3_ENDPOINT}")
    print(f"S3_BUCKET: {S3_BUCKET}")

    if S3_KEY is None or S3_SECRET is None:
        print("S3 credentials are missing, are you sure that you defined S3_KEY and S3_SECRET? Also are you sure that you are importing your .env file properly? (uvicorn main:app --env-file ../.env --reload)")
        return
    print(f"S3_KEY: {S3_KEY[:3]}...")
    print(f"S3_SECRET: {S3_SECRET[:3]}...")

    try:
        s3.head_bucket(Bucket=S3_BUCKET)
        print(f"S3 bucket '{S3_BUCKET}' already exists.")
    except ClientError:
        print(f"S3 bucket '{S3_BUCKET}' does not exist. Creating...")
        s3.create_bucket(Bucket=S3_BUCKET)
        print(f"S3 bucket '{S3_BUCKET}' created.")
    except EndpointConnectionError as e:
        print(
            f"WARNING: Could not reach S3 at {S3_ENDPOINT} (e.g. RustFS not running). "
            "App will start but image uploads will fail. For local dev, use S3_ENDPOINT=http://localhost:9000 if RustFS is running, or run via docker-compose."
        )

@router.post("/file")
async def upload_file(file: UploadFile = File(...)):
    # choose a structured key: uploads/{user}/{random or timestamp}_{filename}
    
    unique_name = generate_filename(file.filename)
    key = f"uploads/{unique_name}"

    try:
        # file.file is a file-like object; boto3 will stream it
        s3.upload_fileobj(file.file, S3_BUCKET, key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Return a URL that the frontend can fetch via your nginx proxy:
    # e.g. /s3/<bucket>/<key>
    proxied_url = f"/s3/{S3_BUCKET}/{key}"
    return {"key": key, "url": proxied_url}

def generate_filename(original_name: str | None):
    # Validate extension
    name = original_name or "upload"
    ext = Path(name).suffix.lower()

    # Optional: restrict allowed extensions
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp"}
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    # Return UUID filename
    return f"{uuid.uuid4().hex}{ext}"
