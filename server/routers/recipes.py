from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from typing import List
import os
import datetime as dt
import asyncpg

from database import get_db

# Server dir so images/ is always server/images/ regardless of CWD
_SERVER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_IMAGES_DIR = os.path.join(_SERVER_DIR, "images")

router = APIRouter(
    prefix="/api/recipe",
    tags=["recipes"],
)


class Ingredient(BaseModel):
    ingredient_id: int | None = None
    recipe_id: int | None = None
    unit: str | None = None
    amount: int
    name: str


class RecipeMetadata(BaseModel):
    id: int | None = None
    name: str
    ingredients: List[Ingredient]
    instructions: str
    notes: str | None = None
    description: str | None = None
    servings: int
    creator_id: int
    category: str
    image_url: str | None = None
    tags: List[str] | None = None
    cookbook_id: int
    modified_at: dt.datetime | None = None  # optional on create; set by DB


def _tags_to_text(tags: List[str] | None) -> str:
    if not tags:
        return "Main"
    return ",".join(tags)


def _text_to_tags(text: str | None) -> List[str]:
    if not text or not text.strip():
        return []
    return [t.strip() for t in text.split(",") if t.strip()]


def _row_to_recipe(row: asyncpg.Record, ingredients: List[dict] | None = None) -> dict:
    """Map DB Recipe row (+ optional ingredients) to API shape."""
    out = {
        "id": row["recipe_id"],
        "name": row["recipe_name"],
        "instructions": row["instructions"],
        "notes": row.get("notes"),
        "description": row.get("description"),
        "servings": row["servings"],
        "creator_id": row["creator_id"],
        "category": row["category"],
        "image_url": row.get("recipe_image_url"),
        "tags": _text_to_tags(row.get("recipe_tags")),
        "cookbook_id": row["book_id"],
        "modified_at": row["modified_dttm"].isoformat() if row.get("modified_dttm") else None,
    }
    if ingredients is not None:
        out["ingredients"] = ingredients
    return out


def _row_to_ingredient(row: asyncpg.Record) -> dict:
    return {
        "ingredient_id": row["ingredient_id"],
        "recipe_id": row["recipe_id"],
        "unit": row.get("unit") or "",
        "amount": row["amount"],
        "name": row["name"],
    }

@router.post("/create/{cookbook_id}")
async def create_recipe(
    cookbook_id: int,
    metadata: str = Form(...),
    image: UploadFile | None = File(None),
    db: asyncpg.Connection = Depends(get_db),
):
    # Form + optional File: multipart when image included; frontend sends form with metadata=JSON.stringify(recipe) and optionally image=file
    recipe_data = RecipeMetadata.model_validate_json(metadata)

    image_filename = None
    if image and image.filename:
        os.makedirs(_IMAGES_DIR, exist_ok=True)
        image_path = os.path.join(_IMAGES_DIR, image.filename)
        with open(image_path, "wb") as f:
            f.write(await image.read())
        image_filename = image.filename

    tags_str = _tags_to_text(recipe_data.tags)
    recipe_row = await db.fetchrow(
        """
        INSERT INTO Recipe (Recipe_name, Instructions, Description, Notes, Servings, Creator_ID, Category, Recipe_Image_URL, Recipe_Tags, Book_ID)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING Recipe_ID, Recipe_name, Instructions, Description, Notes, Servings, Creator_ID, Modified_DtTm, Category, Recipe_Image_URL, Recipe_Tags, Book_ID
        """,
        recipe_data.name,
        recipe_data.instructions,
        recipe_data.description,
        recipe_data.notes,
        recipe_data.servings,
        recipe_data.creator_id,
        recipe_data.category,
        image_filename,
        tags_str,
        cookbook_id,
    )
    recipe_id = recipe_row["recipe_id"]

    for ing in recipe_data.ingredients:
        await db.execute(
            """
            INSERT INTO Ingredients (Recipe_ID, Amount, Unit, Name)
            VALUES ($1, $2, $3, $4)
            """,
            recipe_id,
            ing.amount,
            ing.unit or "",
            ing.name,
        )

    # Load back ingredients for response
    ing_rows = await db.fetch(
        "SELECT Ingredient_ID, Recipe_ID, Amount, Unit, Name FROM Ingredients WHERE Recipe_ID = $1",
        recipe_id,
    )
    created = _row_to_recipe(recipe_row, [_row_to_ingredient(r) for r in ing_rows])
    result = {"message": "Recipe uploaded successfully!", "recipe": created}
    if image_filename is not None:
        result["image_filename"] = image_filename
    return result


@router.post("/edit")
async def edit_recipe(
    recipe: RecipeMetadata,
    db: asyncpg.Connection = Depends(get_db),
):
    if recipe.id is None:
        raise HTTPException(status_code=400, detail="Recipe id is required for edit")
    tags_str = _tags_to_text(recipe.tags)
    recipe_row = await db.fetchrow(
        """
        UPDATE Recipe
        SET Recipe_name = $1, Instructions = $2, Description = $3, Notes = $4, Servings = $5,
            Creator_ID = $6, Category = $7, Recipe_Image_URL = $8, Recipe_Tags = $9, Book_ID = $10,
            Modified_DtTm = CURRENT_TIMESTAMP
        WHERE Recipe_ID = $11
        RETURNING Recipe_ID, Recipe_name, Instructions, Description, Notes, Servings, Creator_ID, Modified_DtTm, Category, Recipe_Image_URL, Recipe_Tags, Book_ID
        """,
        recipe.name,
        recipe.instructions,
        recipe.description,
        recipe.notes,
        recipe.servings,
        recipe.creator_id,
        recipe.category,
        recipe.image_url,
        tags_str,
        recipe.cookbook_id,
        recipe.id,
    )
    if recipe_row is None:
        raise HTTPException(status_code=404, detail="Recipe not found")

    await db.execute("DELETE FROM Ingredients WHERE Recipe_ID = $1", recipe.id)
    for ing in recipe.ingredients:
        await db.execute(
            """
            INSERT INTO Ingredients (Recipe_ID, Amount, Unit, Name)
            VALUES ($1, $2, $3, $4)
            """,
            recipe.id,
            ing.amount,
            ing.unit or "",
            ing.name,
        )

    ing_rows = await db.fetch(
        "SELECT Ingredient_ID, Recipe_ID, Amount, Unit, Name FROM Ingredients WHERE Recipe_ID = $1",
        recipe.id,
    )
    return {
        "message": "Recipe edited successfully!",
        "recipe": _row_to_recipe(recipe_row, [_row_to_ingredient(r) for r in ing_rows]),
    }


@router.post("/delete/{recipe_id}")
async def delete_recipe(
    recipe_id: int,
    db: asyncpg.Connection = Depends(get_db),
):
    await db.execute("DELETE FROM Ingredients WHERE Recipe_ID = $1", recipe_id)
    row = await db.fetchrow(
        "DELETE FROM Recipe WHERE Recipe_ID = $1 RETURNING Recipe_ID",
        recipe_id,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"message": "Recipe deleted successfully!"}


@router.get("/get/{recipe_id}")
async def get_recipe(
    recipe_id: int,
    db: asyncpg.Connection = Depends(get_db),
):
    recipe_row = await db.fetchrow(
        """
        SELECT Recipe_ID, Recipe_name, Instructions, Description, Notes, Servings, Creator_ID, Modified_DtTm, Category, Recipe_Image_URL, Recipe_Tags, Book_ID
        FROM Recipe WHERE Recipe_ID = $1
        """,
        recipe_id,
    )
    if recipe_row is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    ing_rows = await db.fetch(
        "SELECT Ingredient_ID, Recipe_ID, Amount, Unit, Name FROM Ingredients WHERE Recipe_ID = $1",
        recipe_id,
    )
    return _row_to_recipe(recipe_row, [_row_to_ingredient(r) for r in ing_rows])


@router.post("/copy/{recipe_id}/{cookbook_id}")
async def copy_recipe(
    recipe_id: int,
    cookbook_id: int,
    db: asyncpg.Connection = Depends(get_db),
):
    recipe_row = await db.fetchrow(
        """
        SELECT Recipe_ID, Recipe_name, Instructions, Description, Notes, Servings, Creator_ID, Category, Recipe_Image_URL, Recipe_Tags, Book_ID
        FROM Recipe WHERE Recipe_ID = $1
        """,
        recipe_id,
    )
    if recipe_row is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    ing_rows = await db.fetch(
        "SELECT Amount, Unit, Name FROM Ingredients WHERE Recipe_ID = $1 ORDER BY Ingredient_ID",
        recipe_id,
    )

    new_recipe_row = await db.fetchrow(
        """
        INSERT INTO Recipe (Recipe_name, Instructions, Description, Notes, Servings, Creator_ID, Category, Recipe_Image_URL, Recipe_Tags, Book_ID)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING Recipe_ID, Recipe_name, Instructions, Description, Notes, Servings, Creator_ID, Modified_DtTm, Category, Recipe_Image_URL, Recipe_Tags, Book_ID
        """,
        recipe_row["recipe_name"],
        recipe_row["instructions"],
        recipe_row["description"],
        recipe_row["notes"],
        recipe_row["servings"],
        recipe_row["creator_id"],
        recipe_row["category"],
        recipe_row["recipe_image_url"],
        recipe_row["recipe_tags"],
        cookbook_id,
    )
    new_recipe_id = new_recipe_row["recipe_id"]
    for ing in ing_rows:
        await db.execute(
            "INSERT INTO Ingredients (Recipe_ID, Amount, Unit, Name) VALUES ($1, $2, $3, $4)",
            new_recipe_id,
            ing["amount"],
            ing["unit"],
            ing["name"],
        )

    new_ing_rows = await db.fetch(
        "SELECT Ingredient_ID, Recipe_ID, Amount, Unit, Name FROM Ingredients WHERE Recipe_ID = $1",
        new_recipe_id,
    )
    created = _row_to_recipe(new_recipe_row, [_row_to_ingredient(r) for r in new_ing_rows])
    return {"message": "Recipe copied successfully!", "recipe": created}
