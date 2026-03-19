from schemas.recipe import RecipeMetadata
from services.generate_service import format_recipe_for_embedding


async def embed_recipe(recipe: RecipeMetadata) -> str:
    return format_recipe_for_embedding(recipe)
