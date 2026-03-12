import asyncpg
from fastapi import HTTPException

from repositories.cookbook_repo import CookbookRepository
from repositories.recipe_repo import RecipeRepository
from schemas.auth import CurrentUser
from schemas.cookbook import RoleEnum
from schemas.recipe import RecipeMetadata
from services.cookbook_service import CookbookService


class RecipeService:
    def __init__(self, conn: asyncpg.Connection, recipe_repo: RecipeRepository, cookbook_repo: CookbookRepository):
        self.conn = conn
        self.recipe_repo = recipe_repo
        self.cookbook_service = CookbookService(cookbook_repo)

    async def _get_recipe_or_404(self, recipe_id: int) -> RecipeMetadata:
        recipe = await self.recipe_repo.get_recipe(recipe_id)
        if recipe is None:
            raise HTTPException(status_code=404, detail="Recipe not found")
        return recipe

    async def _get_recipe_cookbook_id_or_404(self, recipe_id: int) -> int:
        row = await self.recipe_repo.get_recipe_cookbook_id(recipe_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Recipe not found")
        return row["book_id"]

    async def create_recipe(self, cookbook_id: int, recipe: RecipeMetadata, current_user: CurrentUser) -> dict:
        await self.cookbook_service.require_cookbook_role(
            cookbook_id,
            current_user.id,
            [RoleEnum.owner, RoleEnum.contributor],
        )
        async with self.conn.transaction():
            recipe_row = await self.recipe_repo.create_recipe(
                name=recipe.name,
                description=recipe.description,
                notes=recipe.notes,
                servings=recipe.servings,
                creator_id=current_user.id,
                category=recipe.category,
                image_url=recipe.image_url,
                tags=recipe.tags,
                cookbook_id=cookbook_id,
            )
            recipe_id = recipe_row["recipe_id"]
            await self.recipe_repo.insert_ingredients(recipe_id, recipe.ingredients)
            await self.recipe_repo.insert_instructions(recipe_id, recipe.instructions)

        created = await self.recipe_repo.get_recipe(recipe_id)
        if created is None:
            raise HTTPException(status_code=500, detail="Recipe created but could not be loaded")
        return {"message": "Recipe created successfully!", "recipe": created}

    async def edit_recipe(self, recipe: RecipeMetadata, current_user: CurrentUser) -> dict:
        if recipe.id is None:
            raise HTTPException(status_code=400, detail="Recipe id is required for edit")
        cookbook_id = await self._get_recipe_cookbook_id_or_404(recipe.id)
        await self.cookbook_service.require_cookbook_role(
            cookbook_id,
            current_user.id,
            [RoleEnum.owner, RoleEnum.contributor],
        )

        existing = await self._get_recipe_or_404(recipe.id)
        async with self.conn.transaction():
            recipe_row = await self.recipe_repo.update_recipe(
                recipe_id=recipe.id,
                name=recipe.name,
                description=recipe.description,
                notes=recipe.notes,
                servings=recipe.servings,
                creator_id=existing.creator_id or current_user.id,
                category=recipe.category,
                image_url=recipe.image_url,
                tags=recipe.tags,
                cookbook_id=cookbook_id,
            )
            if recipe_row is None:
                raise HTTPException(status_code=404, detail="Recipe not found")
            await self.recipe_repo.replace_ingredients(recipe.id, recipe.ingredients)
            await self.recipe_repo.replace_instructions(recipe.id, recipe.instructions)

        updated = await self.recipe_repo.get_recipe(recipe.id)
        if updated is None:
            raise HTTPException(status_code=500, detail="Recipe updated but could not be loaded")
        return {"message": "Recipe edited successfully!", "recipe": updated}

    async def delete_recipe(self, recipe_id: int, current_user: CurrentUser) -> dict:
        cookbook_id = await self._get_recipe_cookbook_id_or_404(recipe_id)
        await self.cookbook_service.require_cookbook_role(
            cookbook_id,
            current_user.id,
            [RoleEnum.owner],
        )
        async with self.conn.transaction():
            await self.recipe_repo.delete_ingredients(recipe_id)
            await self.recipe_repo.delete_instructions(recipe_id)
            row = await self.recipe_repo.delete_recipe(recipe_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Recipe not found")
        return {"message": "Recipe deleted successfully!"}

    async def get_recipe(self, recipe_id: int) -> RecipeMetadata:
        recipe = await self.recipe_repo.get_recipe(recipe_id)
        if recipe is None:
            raise HTTPException(status_code=404, detail="Recipe not found")
        return recipe

    async def list_recipes(self, cookbook_id: int, current_user: CurrentUser) -> list[RecipeMetadata]:
        await self.cookbook_service.require_cookbook_role(
            cookbook_id,
            current_user.id,
            [RoleEnum.owner, RoleEnum.contributor, RoleEnum.viewer],
        )
        return await self.recipe_repo.list_recipes(cookbook_id)

    async def copy_recipe(self, recipe_id: int, cookbook_id: int, current_user: CurrentUser) -> dict:
        await self.cookbook_service.require_cookbook_role(
            cookbook_id,
            current_user.id,
            [RoleEnum.owner, RoleEnum.contributor],
        )
        source = await self._get_recipe_or_404(recipe_id)
        payload = self.recipe_repo.clone_recipe_payload(source, cookbook_id)

        async with self.conn.transaction():
            recipe_row = await self.recipe_repo.create_recipe(
                name=payload["name"],
                description=payload["description"],
                notes=payload["notes"],
                servings=payload["servings"],
                creator_id=payload["creator_id"],
                category=payload["category"],
                image_url=payload["image_url"],
                tags=payload["tags"],
                cookbook_id=payload["cookbook_id"],
            )
            new_recipe_id = recipe_row["recipe_id"]
            await self.recipe_repo.insert_ingredients(new_recipe_id, payload["ingredients"])
            await self.recipe_repo.insert_instructions(new_recipe_id, payload["instructions"])

        created = await self.recipe_repo.get_recipe(new_recipe_id)
        if created is None:
            raise HTTPException(status_code=500, detail="Recipe copied but could not be loaded")
        return {"message": "Recipe copied successfully!", "recipe": created}
