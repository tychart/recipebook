from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
import datetime as dt
import asyncpg

from database import get_db
from routers.auth import CurrentUser, get_current_user_dep
from routers.cookbooks import RoleEnum, require_cookbook_role

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


async def _get_recipe_cookbook_id(db: asyncpg.Connection, recipe_id: int) -> int:
    """
    Helper to fetch the cookbook (Book_ID) for a given recipe, or raise 404 if not found.
    """
    row = await db.fetchrow(
        "SELECT Book_ID FROM Recipe WHERE Recipe_ID = $1",
        recipe_id,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return row["book_id"]

@router.post("/create/{cookbook_id}")
async def create_recipe(
    cookbook_id: int,
    recipe: RecipeMetadata,
    db: asyncpg.Connection = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    """Create a recipe in the given cookbook. Frontend uploads image via POST /api/uploads/file and passes the returned url in recipe.image_url."""
    # Require contributor or owner rights on the target cookbook
    await require_cookbook_role(
        db,
        cookbook_id,
        current_user.id,
        [RoleEnum.owner, RoleEnum.contributor],
    )
    tags_str = _tags_to_text(recipe.tags)
    recipe_row = await db.fetchrow(
        """
        INSERT INTO Recipe (Recipe_name, Instructions, Description, Notes, Servings, Creator_ID, Category, Recipe_Image_URL, Recipe_Tags, Book_ID)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        cookbook_id,
    )
    recipe_id = recipe_row["recipe_id"]

    for ing in recipe.ingredients:
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

    ing_rows = await db.fetch(
        "SELECT Ingredient_ID, Recipe_ID, Amount, Unit, Name FROM Ingredients WHERE Recipe_ID = $1",
        recipe_id,
    )
    created = _row_to_recipe(recipe_row, [_row_to_ingredient(r) for r in ing_rows])
    return {"message": "Recipe created successfully!", "recipe": created}


@router.post("/edit")
async def edit_recipe(
    recipe: RecipeMetadata,
    db: asyncpg.Connection = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    if recipe.id is None:
        raise HTTPException(status_code=400, detail="Recipe id is required for edit")
    # Look up cookbook from DB to avoid trusting client-provided cookbook_id
    cookbook_id = await _get_recipe_cookbook_id(db, recipe.id)
    await require_cookbook_role(
        db,
        cookbook_id,
        current_user.id,
        [RoleEnum.owner, RoleEnum.contributor],
    )
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
        cookbook_id,
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
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    cookbook_id = await _get_recipe_cookbook_id(db, recipe_id)
    await require_cookbook_role(
        db,
        cookbook_id,
        current_user.id,
        [RoleEnum.owner],
    )
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


@router.get("/list/{cookbook_id}")
async def list_recipes(
    cookbook_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    await require_cookbook_role(
        db,
        cookbook_id,
        current_user.id,
        [RoleEnum.owner, RoleEnum.contributor, RoleEnum.viewer],
    )
    recipe_rows = await db.fetch(
        """
        SELECT Recipe_ID, Recipe_name, Instructions, Description, Notes, Servings, Creator_ID, Modified_DtTm, Category, Recipe_Image_URL, Recipe_Tags, Book_ID
        FROM Recipe WHERE Book_ID = $1
        ORDER BY Modified_DtTm DESC
        """,
        cookbook_id,
    )
    out = []
    for r in recipe_rows:
        ing_rows = await db.fetch(
            "SELECT Ingredient_ID, Recipe_ID, Amount, Unit, Name FROM Ingredients WHERE Recipe_ID = $1",
            r["recipe_id"],
        )
        out.append(_row_to_recipe(r, [_row_to_ingredient(i) for i in ing_rows]))
    return out


@router.post("/copy/{recipe_id}/{cookbook_id}")
async def copy_recipe(
    recipe_id: int,
    cookbook_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    # Target cookbook: user needs contributor or owner rights
    await require_cookbook_role(
        db,
        cookbook_id,
        current_user.id,
        [RoleEnum.owner, RoleEnum.contributor],
    )
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
