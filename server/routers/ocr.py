from fastapi import APIRouter, FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pytesseract
from PIL import Image
from io import BytesIO
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List, Optional
import re
import os

import logging
import sys

# Configure logging to STDOUT
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout
)
logger = logging.getLogger("api-router")


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
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

client = OpenAI(
    base_url=OLLAMA_URL,
    api_key="ollama", 
)

router = APIRouter(
    prefix="/api/ocr",
    tags=["ocr"],)

def clean_ocr_text(text: str) -> str:
    # 1. Separate numbers from units (e.g., '1c' -> '1 c', '150g' -> '150 g')
    text = re.sub(r'(\d+)([a-zA-Z]+)', r'\1 \2', text)
    
    # 2. Normalize common unicode fractions if they exist
    unicode_fractions = {'½': ' 1/2', '⅓': ' 1/3', '¼': ' 1/4', '¾': ' 3/4'}
    for char, replacement in unicode_fractions.items():
        text = text.replace(char, replacement)
    
    return text

FEW_SHOT_PROMPT = """You are an expert at extracting structured data from messy OCR text.
Ignore noise and formatting errors. 

RULES:
1. QUANTITY: Convert all fractions (e.g., 1 1/2) to decimals (1.5). 
2. UNITS: Always separate the unit from the quantity. If '1c' is found, unit is 'cup'.
3. NOISE: Ignore page numbers or stray OCR characters.

EXAMPLES:
Input: "1 1/2 c all purpose flour"
Output: {"name": "all-purpose flour", "amount": 1.5, "unit": "cup"}

Input: "2tbsp sugar"
Output: {"name": "sugar", "amount": 2.0, "unit": "tbsp"}

Input: "salt to taste"
Output: {"name": "salt", "amount": 0, "unit": "to taste"}
"""

def parse_recipe_with_llm(ocr_text: str) -> RecipeExtraction:
    """Helper function to query Ollama for structured data."""
    response = client.beta.chat.completions.parse(
        model=OLLAMA_MODEL,
        messages=[
            {"role": "system", "content": FEW_SHOT_PROMPT},
            {"role": "user", "content": f"Extract this recipe: \n{ocr_text}"},
        ],
        response_format=RecipeExtraction,
    )
    
    if not response.choices[0].message.parsed:
        raise ValueError("LLM failed to parse the recipe text.")
        
    return response.choices[0].message.parsed

@router.post("/process-recipe")
async def process_recipe_image(image: UploadFile = File(...)):
    try:
        # 1. Perform OCR
        contents = await image.read()
        img = Image.open(BytesIO(contents))
        raw_text = pytesseract.image_to_string(img)
        
        if not raw_text.strip():
            return JSONResponse(content={"error": "No text detected in image"}, status_code=400)
        
        cleaned_text = clean_ocr_text(raw_text)
        logger.info(f"Cleaned OCR: {cleaned_text}")
        # 2. Extract structured data using the LLM
        structured_recipe = parse_recipe_with_llm(raw_text)
        
        # 3. Return the final recipe as a JSONResponse
        # model_dump() converts the Pydantic object into a standard Python dict
        return JSONResponse(content=structured_recipe.model_dump(), status_code=200)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
