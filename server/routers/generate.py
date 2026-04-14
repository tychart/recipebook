from fastapi import APIRouter, Depends, File, Form, UploadFile

from dependencies.auth import get_current_user_dep
from dependencies.services import get_generate_service
from schemas.auth import CurrentUser
from schemas.generate import GenerateSearchRequest
from schemas.job import GenerateTextRequest
from services.generate_service import GenerateService

router = APIRouter(
    prefix="/api/generate",
    tags=["generate"],
)

@router.post("/text", status_code=202)
async def generate_text(
    body: GenerateTextRequest,
    generate_service: GenerateService = Depends(get_generate_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await generate_service.enqueue_text_job(body, current_user)


@router.post("/image", status_code=202)
async def generate_image(
    image: UploadFile = File(...),
    context_text: str | None = Form(None),
    generate_service: GenerateService = Depends(get_generate_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await generate_service.enqueue_image_upload(image, current_user, context_text)


@router.post("/search")
async def search_recipes(
    body: GenerateSearchRequest,
    generate_service: GenerateService = Depends(get_generate_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await generate_service.process_search_query(body, current_user)


@router.post("/reembed")
async def reembed_recipes(
    generate_service: GenerateService = Depends(get_generate_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await generate_service.reembed_user_recipes(current_user)


@router.get("/jobs")
async def list_jobs(
    generate_service: GenerateService = Depends(get_generate_service),
    current_user=Depends(get_current_user_dep),
):
    return await generate_service.list_jobs(current_user)


@router.get("/jobs/{job_id}")
async def get_job(
    job_id: str,
    generate_service: GenerateService = Depends(get_generate_service),
    current_user=Depends(get_current_user_dep),
):
    return await generate_service.get_job(job_id, current_user)


@router.post("/jobs/{job_id}/retry", status_code=202)
async def retry_job(
    job_id: str,
    generate_service: GenerateService = Depends(get_generate_service),
    current_user=Depends(get_current_user_dep),
):
    return await generate_service.retry_job(job_id, current_user)
