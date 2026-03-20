import logging
import os
import time
from io import BytesIO
from typing import List, Optional

import pytesseract
from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
from openai import OpenAI
from PIL import Image
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class Ingredient(BaseModel):
    name: str = Field(description="The name of the ingredient, e.g., 'all-purpose flour'")
    amount: float = Field(description="The numeric value only, e.g., 2.5")
    unit: str = Field(description="The measurement unit, e.g., 'cups', 'grams', or 'tsp'")

class RecipeExtraction(BaseModel):
    recipe_name: str
    recipe_author: Optional[str] = Field(default="", description="The author's name, or blank if not found")
    ingredients: List[Ingredient]
    instructions: List[str]

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "ollama")
LLM_MODEL = os.getenv("LLM_MODEL", "lfm2.5-thinking")

if (OPENAI_API_KEY == "ollama"):
    client = OpenAI(
        base_url=OLLAMA_URL,
        api_key="ollama", 
    )
else:
    client = OpenAI(
        api_key=OPENAI_API_KEY
    )

router = APIRouter(
    prefix="/api/ocr",
    tags=["ocr"],)

def parse_recipe_with_llm(ocr_text: str) -> RecipeExtraction:
    """Helper function to query Ollama for structured data."""
    response = client.beta.chat.completions.parse(
        model=LLM_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert at extracting structured data from messy OCR text. "
                    "Ignore noise and formatting errors. For ingredients, strictly separate "
                    "the numeric quantity from the unit of measurement."
                ),
            },
            {"role": "user", "content": ocr_text},
        ],
        response_format=RecipeExtraction,
    )
    
    if not response.choices[0].message.parsed:
        raise ValueError("LLM failed to parse the recipe text.")
        
    return response.choices[0].message.parsed

@router.post("/process-recipe")
async def process_recipe_image(image: UploadFile = File(...)):
    request_started = time.perf_counter()
    file_name = image.filename or "<unknown>"
    content_type = image.content_type or "<unknown>"

    try:
        logger.info(
            "OCR request received filename=%s content_type=%s",
            file_name,
            content_type,
        )

        contents = await image.read()
        logger.info(
            "OCR upload read filename=%s bytes=%s",
            file_name,
            len(contents),
        )

        img = Image.open(BytesIO(contents))
        logger.info(
            "OCR image decoded filename=%s format=%s size=%sx%s",
            file_name,
            img.format,
            img.width,
            img.height,
        )

        raw_text = pytesseract.image_to_string(img)
        logger.info(
            "OCR text extracted filename=%s text_length=%s",
            file_name,
            len(raw_text),
        )

        logger.debug(
            "Parsed text: %s",
            raw_text
        )
        
        if not raw_text.strip():
            logger.warning("OCR produced no text filename=%s", file_name)
            return JSONResponse(content={"error": "No text detected in image"}, status_code=400)

        logger.info("OCR starting LLM parse filename=%s model=%s", file_name, LLM_MODEL)
        structured_recipe = parse_recipe_with_llm(raw_text)
        logger.info(
            "OCR LLM parse complete filename=%s ingredient_count=%s instruction_count=%s duration_ms=%.2f",
            file_name,
            len(structured_recipe.ingredients),
            len(structured_recipe.instructions),
            (time.perf_counter() - request_started) * 1000,
        )
        
        return JSONResponse(content=structured_recipe.model_dump(), status_code=200)

    except Exception:
        logger.exception(
            "OCR request failed filename=%s content_type=%s duration_ms=%.2f",
            file_name,
            content_type,
            (time.perf_counter() - request_started) * 1000,
        )
        raise
