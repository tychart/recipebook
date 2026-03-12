from fastapi import APIRouter, Depends
import asyncpg
from openai import OpenAI

from database import get_db
from routers.recipes import RecipeMetadata, get_recipe
from ml.embedding import embed_recipe

MODEL = "all-minilm"

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",  # required but unused by Ollama
)

router = APIRouter(
    prefix="/api/generate",
    tags=["generate"],
)

@router.post("/test")
async def do_stuff(db: asyncpg.Connection = Depends(get_db)):
    print("Hello world")
    recipe = await get_recipe(1, db)
    return recipe





def _format_recipe_for_embedding(recipe: RecipeMetadata) -> str:
    # Produce a structured textual representation. Keep instruction order.
    parts = []
    parts.append(f"Title: {recipe.name}")
    if recipe.description:
        parts.append(f"Description: {recipe.description}")
    if recipe.notes:
        parts.append(f"Notes: {recipe.notes}")
    parts.append(f"Category: {recipe.category}")
    parts.append(f"Servings: {recipe.servings}")
    if recipe.tags:
        parts.append("Tags: " + ", ".join(recipe.tags))

    # Ingredients: preserve order and unit/amount if present
    ingr_lines = []
    for i in recipe.ingredients:
        amt = f"{i.amount:g}" if i.amount is not None else ""
        unit = f" {i.unit}" if i.unit else ""
        name = i.name
        ingr_lines.append(f"- {amt}{unit} {name}".strip())
    if ingr_lines:
        parts.append("Ingredients:\n" + "\n".join(ingr_lines))

    # Instructions: order by instruction_number to be safe
    instr_sorted = sorted(recipe.instructions, key=lambda x: x.instruction_number)
    instr_lines = [f"{ins.instruction_number}. {ins.instruction_text}" for ins in instr_sorted]
    if instr_lines:
        parts.append("Instructions:\n" + "\n".join(instr_lines))

    # Additional metadata if you want to make retrieval-aware
    parts.append(f"CreatorID: {recipe.creator_id}")
    parts.append(f"CookbookID: {recipe.cookbook_id}")

    # join with double newline to keep sections distinct
    return "\n\n".join(parts)

