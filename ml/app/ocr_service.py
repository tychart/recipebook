import json
import logging
import tempfile
import threading
import time
from io import BytesIO
from pathlib import Path
from typing import Any, Protocol

from .config import Settings

logger = logging.getLogger(__name__)


class OcrProvider(Protocol):
    provider_name: str

    def extract_text(self, image_bytes: bytes, filename: str | None = None) -> tuple[str, dict[str, Any]]:
        ...


class TesseractOcrProvider:
    provider_name = "tesseract"

    def __init__(self, settings: Settings):
        self.settings = settings

    def extract_text(self, image_bytes: bytes, filename: str | None = None) -> tuple[str, dict[str, Any]]:
        from PIL import Image
        import pytesseract

        image = Image.open(BytesIO(image_bytes))
        image.load()
        raw_text = pytesseract.image_to_string(
            image=image,
            lang=self.settings.ocr_tesseract_lang,
            output_type=pytesseract.Output.STRING,
        )
        return raw_text, {
            "engine": self.provider_name,
            "model": "tesseract",
            "fallback_used": False,
        }


class PaddleOcrProvider:
    provider_name = "paddleocr"

    def __init__(self, settings: Settings):
        self.settings = settings
        self._pipeline = None

    def extract_text(self, image_bytes: bytes, filename: str | None = None) -> tuple[str, dict[str, Any]]:
        pipeline = self._get_pipeline()
        suffix = Path(filename or "upload.png").suffix or ".png"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as handle:
            handle.write(image_bytes)
            handle.flush()
            results = pipeline.predict(handle.name)

        raw_text = self._extract_text_from_results(results)
        if not raw_text.strip():
            raise RuntimeError("PaddleOCR returned no text")

        return raw_text, {
            "engine": self.provider_name,
            "model": self.settings.ocr_paddle_model,
            "fallback_used": False,
        }

    def _get_pipeline(self):
        if self._pipeline is None:
            from paddleocr import PaddleOCRVL

            self._pipeline = PaddleOCRVL(device=self.settings.ocr_paddle_device)
        return self._pipeline

    def _extract_text_from_results(self, results: Any) -> str:
        fragments = self._collect_text_fragments(results)
        text = "\n".join(fragment for fragment in fragments if fragment)
        return text.strip()

    def _collect_text_fragments(self, value: Any) -> list[str]:
        if value is None:
            return []

        if isinstance(value, str):
            normalized = value.strip()
            return [normalized] if normalized else []

        if isinstance(value, (int, float, bool)):
            return []

        if isinstance(value, (list, tuple)):
            fragments: list[str] = []
            for item in value:
                fragments.extend(self._collect_text_fragments(item))
            return fragments

        if isinstance(value, dict):
            return self._collect_from_mapping(value)

        for converter_name in ("to_dict", "model_dump", "dict"):
            converter = getattr(value, converter_name, None)
            if callable(converter):
                try:
                    converted = converter()
                except TypeError:
                    continue
                return self._collect_text_fragments(converted)

        json_attr = getattr(value, "json", None)
        if callable(json_attr):
            try:
                converted = json.loads(json_attr())
            except Exception:
                converted = None
            if converted is not None:
                return self._collect_text_fragments(converted)

        fragments: list[str] = []
        for attr_name in ("markdown", "res", "result", "rec_texts", "text"):
            if hasattr(value, attr_name):
                fragments.extend(self._collect_text_fragments(getattr(value, attr_name)))
        return fragments

    def _collect_from_mapping(self, value: dict[str, Any]) -> list[str]:
        markdown = value.get("markdown")
        if isinstance(markdown, dict):
            markdown_text = markdown.get("text")
            if isinstance(markdown_text, str) and markdown_text.strip():
                return [markdown_text.strip()]

        if isinstance(value.get("rec_texts"), list):
            return [
                str(item).strip()
                for item in value["rec_texts"]
                if isinstance(item, str) and item.strip()
            ]

        if isinstance(value.get("text"), str) and value["text"].strip():
            return [value["text"].strip()]

        fragments: list[str] = []
        for key in ("layoutParsingResults", "prunedResult", "result", "res", "output"):
            if key in value:
                fragments.extend(self._collect_text_fragments(value[key]))
        return fragments


class OcrService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._paddle = PaddleOcrProvider(settings)
        self._tesseract = TesseractOcrProvider(settings)
        self._pipeline_lock = threading.Lock()
        self._ready = False
        self._last_warmup_error: str | None = None

    def describe(self) -> dict[str, Any]:
        return {
            "configured_engine": self.settings.ocr_engine,
            "auto_fallback": self.settings.ocr_auto_fallback,
            "paddle_device": self.settings.ocr_paddle_device,
            "paddle_model": self.settings.ocr_paddle_model,
            "ready": self._ready,
            "last_warmup_error": self._last_warmup_error,
        }

    def is_ready(self) -> bool:
        return self._ready

    def warmup(self) -> None:
        with self._pipeline_lock:
            try:
                if self.settings.ocr_engine == "tesseract":
                    self._last_warmup_error = None
                    self._ready = True
                    return

                if self.settings.ocr_engine != "paddleocr":
                    raise RuntimeError(f"Unsupported OCR engine: {self.settings.ocr_engine}")

                self._paddle._get_pipeline()
                self._last_warmup_error = None
                self._ready = True
            except Exception as exc:
                self._ready = False
                self._last_warmup_error = str(exc)
                logger.exception("OCR warmup failed")
                if not self.settings.ocr_auto_fallback:
                    raise
                logger.warning("OCR warmup will rely on Tesseract fallback until PaddleOCR is available")

    def extract_text(self, image_bytes: bytes, filename: str | None = None) -> tuple[str, dict[str, Any]]:
        started = time.perf_counter()
        engine = self.settings.ocr_engine

        with self._pipeline_lock:
            if engine == "tesseract":
                text, metadata = self._tesseract.extract_text(image_bytes, filename=filename)
                self._ready = True
                return text, self._finalize_metadata(metadata, started)

            if engine != "paddleocr":
                raise RuntimeError(f"Unsupported OCR engine: {engine}")

            try:
                text, metadata = self._paddle.extract_text(image_bytes, filename=filename)
                self._ready = True
                self._last_warmup_error = None
                return text, self._finalize_metadata(metadata, started)
            except Exception as exc:
                logger.warning("PaddleOCR failed: %s", exc)
                self._ready = False
                self._last_warmup_error = str(exc)
                if not self.settings.ocr_auto_fallback:
                    raise

                text, metadata = self._tesseract.extract_text(image_bytes, filename=filename)
                metadata["fallback_used"] = True
                metadata["fallback_reason"] = str(exc)
                return text, self._finalize_metadata(metadata, started)

    def _finalize_metadata(self, metadata: dict[str, Any], started: float) -> dict[str, Any]:
        finalized = dict(metadata)
        finalized["elapsed_ms"] = round((time.perf_counter() - started) * 1000, 2)
        return finalized
