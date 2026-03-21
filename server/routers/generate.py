from fastapi import APIRouter, Depends

from dependencies.auth import get_current_user_dep
from dependencies.services import get_generate_service
from schemas.auth import CurrentUser
from schemas.job import GenerateOcrRequest, GenerateTextRequest
from services.generate_service import GenerateService

router = APIRouter(
    prefix="/api/generate",
    tags=["generate"],
)

@router.post("/test")
async def do_stuff(generate_service: GenerateService = Depends(get_generate_service)):
    return await generate_service.get_debug_recipe(1)

@router.post("/text")
async def generate_text(
    body: GenerateTextRequest,
    generate_service: GenerateService = Depends(get_generate_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await generate_service.enqueue_text_job(body, current_user)


@router.post("/ocr")
async def generate_ocr(
    body: GenerateOcrRequest,
    generate_service: GenerateService = Depends(get_generate_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await generate_service.enqueue_ocr_job(body, current_user)


@router.get("/jobs")
async def list_jobs(
    generate_service: GenerateService = Depends(get_generate_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await generate_service.list_jobs(current_user)


@router.get("/jobs/{job_id}")
async def get_job(
    job_id: str,
    generate_service: GenerateService = Depends(get_generate_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await generate_service.get_job(job_id, current_user)
