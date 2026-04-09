from ml.app.config import Settings
from ml.app.ocr_service import OcrService


def make_settings(**overrides) -> Settings:
    defaults = {
        "port": 8001,
        "ocr_engine": "paddleocr",
        "ocr_auto_fallback": True,
        "ocr_tesseract_lang": "eng",
        "ocr_paddle_device": "cpu",
        "ocr_paddle_model": "PaddleOCR-VL-1.5",
        "warmup_on_startup": True,
    }
    defaults.update(overrides)
    return Settings(**defaults)


def test_ocr_service_falls_back_to_tesseract(monkeypatch):
    service = OcrService(make_settings(ocr_engine="paddleocr", ocr_auto_fallback=True))

    monkeypatch.setattr(
        service._paddle,
        "extract_text",
        lambda image_bytes, filename=None: (_ for _ in ()).throw(RuntimeError("gpu unavailable")),
    )
    monkeypatch.setattr(
        service._tesseract,
        "extract_text",
        lambda image_bytes, filename=None: (
            "fallback text",
            {"engine": "tesseract", "model": "tesseract", "fallback_used": False},
        ),
    )

    text, metadata = service.extract_text(b"img", filename="recipe.png")

    assert text == "fallback text"
    assert metadata["engine"] == "tesseract"
    assert metadata["fallback_used"] is True
    assert metadata["fallback_reason"] == "gpu unavailable"


def test_ocr_service_does_not_fallback_when_disabled(monkeypatch):
    service = OcrService(make_settings(ocr_engine="paddleocr", ocr_auto_fallback=False))

    monkeypatch.setattr(
        service._paddle,
        "extract_text",
        lambda image_bytes, filename=None: (_ for _ in ()).throw(RuntimeError("paddle failed")),
    )

    try:
        service.extract_text(b"img", filename="recipe.png")
    except RuntimeError as exc:
        assert str(exc) == "paddle failed"
        return

    raise AssertionError("Expected RuntimeError when fallback is disabled")


def test_ocr_service_can_use_tesseract_directly(monkeypatch):
    service = OcrService(make_settings(ocr_engine="tesseract", ocr_auto_fallback=True))

    monkeypatch.setattr(
        service._tesseract,
        "extract_text",
        lambda image_bytes, filename=None: (
            "direct text",
            {"engine": "tesseract", "model": "tesseract", "fallback_used": False},
        ),
    )

    text, metadata = service.extract_text(b"img", filename="recipe.png")

    assert text == "direct text"
    assert metadata["engine"] == "tesseract"
    assert metadata["fallback_used"] is False
