from fastapi import APIRouter, FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pytesseract
from PIL import Image
from io import BytesIO
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List, Optional
import os

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

client = OpenAI(
    base_url=OLLAMA_URL,
    api_key="ollama", 
)

router = APIRouter(
    prefix="/api/ocr",
    tags=["ocr"],)

def parse_recipe_with_llm(ocr_text: str) -> RecipeExtraction:
    """Helper function to query Ollama for structured data."""
    response = client.beta.chat.completions.parse(
        #model="llama3.1:8b",
        model="llama3.2",
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
    try:
        # 1. Perform OCR
        contents = await image.read()
        img = Image.open(BytesIO(contents))
        raw_text = pytesseract.image_to_string(img)
        
        if not raw_text.strip():
            return JSONResponse(content={"error": "No text detected in image"}, status_code=400)

        # 2. Extract structured data using the LLM
        structured_recipe = parse_recipe_with_llm(raw_text)
        
        # 3. Return the final recipe as a JSONResponse
        # model_dump() converts the Pydantic object into a standard Python dict
        return JSONResponse(content=structured_recipe.model_dump(), status_code=200)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
