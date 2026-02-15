from fastapi import APIRouter, UploadFile, Form, File
from pydantic import BaseModel
from typing import List
import os

router = APIRouter(
    prefix="/api/recipe",
    tags=["recipes"]
)


class Ingredient(BaseModel):
    ingredient_id: int | None = None
    recipe_id: int | None = None
    amount: str
    name: str

class RecipeMetadata(BaseModel):
    recipe_id: int | None = None
    name: str
    ingredients: List[Ingredient]
    instructions: str
    notes: str | None = None
    author: str
    servings: int
    creator_id: int
    category: str
    tags: List[str]
    cookbook_id: int

@router.post("/create")
async def create_recipe(
    metadata: str = Form(...),
    image: UploadFile = File(...)
):
    # Parse JSON string into Pydantic model
    recipe_data = RecipeMetadata.model_validate_json(metadata)

    # Save the image
    os.makedirs("images", exist_ok=True)
    image_path = os.path.join("images", image.filename)
    with open(image_path, "wb") as f:
        f.write(await image.read())

    # TODO: send recipe data (including ingredients individually) and image url? to server

    return {
        "message": "Recipe uploaded successfully!",
        "recipe": recipe_data.model_dump(),
        "image_filename": image.filename
    }

@router.post("/edit")
async def edit_recipe(
    metadata: str = Form(...)
):
    # Parse JSON string into Pydantic model
    recipe_data = RecipeMetadata.model_validate_json(metadata)
    # TODO: send recipe data (including ingredients individually) to server

    return {
        "message": "Recipe edited successfully!",
        "recipe": recipe_data.model_dump()
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

@router.post("/copy/{recipe_id, user_id}")
async def copy_recipe(
        recipe_id: int,
        user_id: int
):
    # TODO: get recipe from database using recipe_id and copy it to a new one for a user_id
    # TODO: Note will either need to get ingredients also with recipe_id or call helper function to do that
    return {
        "message": "Recipe copied successfully!"
    }

