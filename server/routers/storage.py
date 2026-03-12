from fastapi import APIRouter, Depends, File, UploadFile

from dependencies.services import get_storage_service_dep
from services.storage_service import StorageService, get_storage_service

router = APIRouter(
    prefix="/api/uploads",
    tags=["storage"],
)

@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    storage_service: StorageService = Depends(get_storage_service_dep),
):
    return await storage_service.upload_file(file)


def ensure_bucket_exists() -> None:
    get_storage_service().ensure_bucket_exists()


def generate_filename(original_name: str | None) -> str:
    return get_storage_service().generate_filename(original_name)
