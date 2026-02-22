from fastapi import APIRouter, UploadFile, Form, File
from pydantic import BaseModel
from typing import List
import os
import datetime as dt

# Server dir so images/ is always server/images/ regardless of CWD
_SERVER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_IMAGES_DIR = os.path.join(_SERVER_DIR, "images")

router = APIRouter(
    prefix="/api/recipe",
    tags=["recipes"]
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
    modified_at: dt.datetime

# TODO: add the requirement that create recipe needs a cookbook
@router.post("/create/{cookbook_id}")
async def create_recipe(
        cookbook_id: int,
        metadata: str = Form(...),
        image: UploadFile | None = File(None),
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

    # TODO: send recipe data (including ingredients individually) and image url? to server

    result = {
        "message": "Recipe uploaded successfully!",
        "recipe": recipe_data.model_dump(),
    }
    if image_filename is not None:
        result["image_filename"] = image_filename
    return result


@router.post("/edit")
async def edit_recipe(recipe: RecipeMetadata):
    # TODO: send recipe data (including ingredients individually) to server
    return {
        "message": "Recipe edited successfully!",
        "recipe": recipe.model_dump(),
    }


@router.post("/delete/{recipe_id}")
async def delete_recipe(
        recipe_id: int
):
    # TODO: delete recipe and it's ingredients from database with recipe_id
    return {
        "message": "Recipe deleted successfully!"
    }


@router.get("/get/{recipe_id}")
async def get_recipe(recipe_id: int):
    # TODO: get recipe from database using recipe_id and set it's data in recipe_data
    # TODO: Note will either need to get ingredients also with recipe_id or call helper function to do that
    recipe_data = ""
    return recipe_data


@router.post("/copy/{recipe_id}/{cookbook_id}")
async def copy_recipe(
        recipe_id: int,
        cookbook_id: int
):
    # TODO: get recipe from database using recipe_id and copy it to a new one for a user_id
    # TODO: Note will either need to get ingredients also with recipe_id or call helper function to do that
    return {
        "message": "Recipe copied successfully!"
    }
