import asyncio
import logging
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from .config import get_settings
from .ocr_service import OcrService

logger = logging.getLogger(__name__)

app = FastAPI(title="recipebook-ml")
settings = get_settings()
ocr_service = OcrService(settings)


class OcrResponse(BaseModel):
    text: str
    metadata: dict[str, Any] = Field(default_factory=dict)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "recipebook-ml",
        "ocr": ocr_service.describe(),
    }


@app.post("/ocr", response_model=OcrResponse)
async def run_ocr(image: UploadFile = File(...)) -> OcrResponse:
    contents = await image.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Image upload is required")

    try:
        text, metadata = await asyncio.to_thread(
            ocr_service.extract_text,
            contents,
            image.filename,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("OCR request failed filename=%s", image.filename or "<unknown>")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not text.strip():
        raise HTTPException(status_code=422, detail="OCR produced no text")

    return OcrResponse(text=text, metadata=metadata)
