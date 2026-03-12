from fastapi import APIRouter, Depends

from dependencies.auth import get_current_user_dep
from dependencies.services import get_recipe_service
from schemas.auth import CurrentUser
from schemas.recipe import Ingredient, Instruction, RecipeMetadata
from services.recipe_service import RecipeService

router = APIRouter(
    prefix="/api/recipe",
    tags=["recipes"],
)

@router.post("/create/{cookbook_id}")
async def create_recipe(
    cookbook_id: int,
    recipe: RecipeMetadata,
    recipe_service: RecipeService = Depends(get_recipe_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await recipe_service.create_recipe(cookbook_id, recipe, current_user)


@router.post("/edit")
async def edit_recipe(
    recipe: RecipeMetadata,
    recipe_service: RecipeService = Depends(get_recipe_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await recipe_service.edit_recipe(recipe, current_user)


@router.post("/delete/{recipe_id}")
async def delete_recipe(
    recipe_id: int,
    recipe_service: RecipeService = Depends(get_recipe_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await recipe_service.delete_recipe(recipe_id, current_user)


@router.get("/get/{recipe_id}")
async def get_recipe(
    recipe_id: int,
    recipe_service: RecipeService = Depends(get_recipe_service),
):
    return await recipe_service.get_recipe(recipe_id)


@router.get("/list/{cookbook_id}")
async def list_recipes(
    cookbook_id: int,
    recipe_service: RecipeService = Depends(get_recipe_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await recipe_service.list_recipes(cookbook_id, current_user)


@router.post("/copy/{recipe_id}/{cookbook_id}")
async def copy_recipe(
    recipe_id: int,
    cookbook_id: int,
    recipe_service: RecipeService = Depends(get_recipe_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await recipe_service.copy_recipe(recipe_id, cookbook_id, current_user)
