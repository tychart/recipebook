import os
from dataclasses import dataclass
from functools import lru_cache


def _get_bool_env(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    port: int
    ocr_engine: str
    ocr_auto_fallback: bool
    ocr_tesseract_lang: str
    ocr_paddle_device: str
    ocr_paddle_model: str
    warmup_on_startup: bool


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        port=int(os.getenv("ML_PORT", "8001")),
        ocr_engine=os.getenv("ML_OCR_ENGINE", "paddleocr").strip().lower(),
        ocr_auto_fallback=_get_bool_env("ML_OCR_AUTO_FALLBACK", True),
        ocr_tesseract_lang=os.getenv("ML_OCR_TESSERACT_LANG", "eng").strip() or "eng",
        ocr_paddle_device=os.getenv("ML_OCR_PADDLE_DEVICE", "cpu").strip() or "cpu",
        ocr_paddle_model=os.getenv("ML_OCR_PADDLE_MODEL", "PaddleOCR-VL-1.5").strip() or "PaddleOCR-VL-1.5",
        warmup_on_startup=_get_bool_env("ML_WARMUP_ON_STARTUP", True),
    )
