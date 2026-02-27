from fastapi import APIRouter

router = APIRouter(
    prefix="/api/generate",
    tags=["generate"],
)