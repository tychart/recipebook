import logging

import asyncpg
from fastapi import HTTPException, UploadFile

from inference.embedding import embed_text, format_recipe_for_embedding, get_embedding_model
from repositories.cookbook_repo import CookbookRepository
from repositories.recipe_repo import RecipeRepository
from schemas.auth import CurrentUser
from schemas.cookbook import RoleEnum
from schemas.recipe import RecipeMetadata
from services.cookbook_service import CookbookService
from services.storage_service import StorageService

logger = logging.getLogger(__name__)


class RecipeService:
    def __init__(
        self,
        conn: asyncpg.Connection,
        recipe_repo: RecipeRepository,
        cookbook_service: CookbookService,
        storage_service: StorageService,
    ):
        self.conn = conn
        self.recipe_repo = recipe_repo
        self.cookbook_service = cookbook_service
        self.storage_service = storage_service

    def _present_recipe(self, recipe: RecipeMetadata) -> RecipeMetadata:
        if not recipe.image_url:
            return recipe
        return recipe.model_copy(
            update={"image_url": self.storage_service.build_presigned_get_url(recipe.image_url)},
        )

    async def _get_recipe_or_404(self, recipe_id: int) -> RecipeMetadata:
        recipe = await self.recipe_repo.get_recipe(recipe_id)
        if recipe is None:
            raise HTTPException(status_code=404, detail="Recipe not found")
        return recipe

    async def _get_recipe_cookbook_id_or_404(self, recipe_id: int) -> int:
        cookbook_id = await self.recipe_repo.get_recipe_cookbook_id(recipe_id)
        if cookbook_id is None:
            raise HTTPException(status_code=404, detail="Recipe not found")
        return cookbook_id

    async def refresh_recipe_embedding(self, recipe_id: int) -> bool:
        recipe = await self.recipe_repo.get_recipe(recipe_id)
        if recipe is None:
            return False

        try:
            model = get_embedding_model()
            formatted_str = format_recipe_for_embedding(recipe) 
            embedding = await embed_text(formatted_str, model=model)
            await self.recipe_repo.update_recipe_embedding(recipe_id, embedding)
            return True
        except RuntimeError as exc:
            logger.warning("Skipping embedding refresh recipe_id=%s: %s", recipe_id, exc)
            return False
        except Exception:
            logger.exception("Embedding refresh failed recipe_id=%s", recipe_id)
            return False

    async def backfill_missing_embeddings(self) -> int:
        updated = 0
        for recipe_id in await self.recipe_repo.list_recipe_ids_missing_embeddings():
            if await self.refresh_recipe_embedding(recipe_id):
                updated += 1
        return updated

    async def reembed_recipes_for_user(self, current_user: CurrentUser) -> dict[str, int]:
        processed = 0
        updated = 0

        for recipe_id in await self.recipe_repo.list_accessible_recipe_ids_for_user(current_user.id):
            processed += 1
            if await self.refresh_recipe_embedding(recipe_id):
                updated += 1

        return {
            "processed_count": processed,
            "updated_count": updated,
        }

    async def create_recipe(
        self,
        cookbook_id: int,
        recipe: RecipeMetadata,
        current_user: CurrentUser,
        image_file: UploadFile | None = None,
    ) -> dict:
        await self.cookbook_service.require_cookbook_role(
            cookbook_id,
            current_user.id,
            [RoleEnum.owner, RoleEnum.contributor],
        )
        image_key: str | None = None
        async with self.conn.transaction():
            try:
                if image_file is not None:
                    image_key = await self.storage_service.upload_recipe_image(image_file, cookbook_id)
                created_recipe = await self.recipe_repo.create_recipe(
                    name=recipe.name,
                    description=recipe.description,
                    notes=recipe.notes,
                    servings=recipe.servings,
                    creator_id=current_user.id,
                    category=recipe.category,
                    image_url=image_key,
                    tags=recipe.tags,
                    cookbook_id=cookbook_id,
                )
                recipe_id = created_recipe.id
                await self.recipe_repo.insert_ingredients(recipe_id, recipe.ingredients)
                await self.recipe_repo.insert_instructions(recipe_id, recipe.instructions)
            except Exception:
                if image_key is not None:
                    self.storage_service.delete_object(image_key)
                raise

        created = await self.recipe_repo.get_recipe(recipe_id)
        if created is None:
            raise HTTPException(status_code=500, detail="Recipe created but could not be loaded")
        await self.refresh_recipe_embedding(recipe_id)
        return {"message": "Recipe created successfully!", "recipe": self._present_recipe(created)}

    async def edit_recipe(
        self,
        recipe: RecipeMetadata,
        current_user: CurrentUser,
        image_file: UploadFile | None = None,
    ) -> dict:
        if recipe.id is None:
            raise HTTPException(status_code=400, detail="Recipe id is required for edit")
        cookbook_id = await self._get_recipe_cookbook_id_or_404(recipe.id)
        await self.cookbook_service.require_cookbook_role(
            cookbook_id,
            current_user.id,
            [RoleEnum.owner, RoleEnum.contributor],
        )

        existing = await self._get_recipe_or_404(recipe.id)
        if existing.creator_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the recipe owner can edit this recipe",
            )
        new_image_key: str | None = None
        async with self.conn.transaction():
            try:
                if image_file is not None:
                    new_image_key = await self.storage_service.upload_recipe_image(image_file, cookbook_id)
                updated_recipe = await self.recipe_repo.update_recipe(
                    recipe_id=recipe.id,
                    name=recipe.name,
                    description=recipe.description,
                    notes=recipe.notes,
                    servings=recipe.servings,
                    creator_id=existing.creator_id or current_user.id,
                    category=recipe.category,
                    image_url=new_image_key if new_image_key is not None else existing.image_url,
                    tags=recipe.tags,
                    cookbook_id=cookbook_id,
                )
                if updated_recipe is None:
                    raise HTTPException(status_code=404, detail="Recipe not found")
                await self.recipe_repo.replace_ingredients(recipe.id, recipe.ingredients)
                await self.recipe_repo.replace_instructions(recipe.id, recipe.instructions)
            except Exception:
                if new_image_key is not None:
                    self.storage_service.delete_object(new_image_key)
                raise

        if new_image_key is not None and existing.image_url:
            self.storage_service.delete_object(existing.image_url)

        updated = await self.recipe_repo.get_recipe(recipe.id)
        if updated is None:
            raise HTTPException(status_code=500, detail="Recipe updated but could not be loaded")
        await self.refresh_recipe_embedding(recipe.id)
        return {"message": "Recipe edited successfully!", "recipe": self._present_recipe(updated)}

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
            deleted_id = await self.recipe_repo.delete_recipe(recipe_id)
        if deleted_id is None:
            raise HTTPException(status_code=404, detail="Recipe not found")
        return {"message": "Recipe deleted successfully!"}

    async def get_recipe(self, recipe_id: int) -> RecipeMetadata:
        recipe = await self.recipe_repo.get_recipe(recipe_id)
        if recipe is None:
            raise HTTPException(status_code=404, detail="Recipe not found")
        return self._present_recipe(recipe)

    async def list_recipes(self, cookbook_id: int, current_user: CurrentUser) -> list[RecipeMetadata]:
        await self.cookbook_service.require_cookbook_role(
            cookbook_id,
            current_user.id,
            [RoleEnum.owner, RoleEnum.contributor, RoleEnum.viewer],
        )
        recipes = await self.recipe_repo.list_recipes(cookbook_id)
        return [self._present_recipe(recipe) for recipe in recipes]

    async def copy_recipe(self, recipe_id: int, cookbook_id: int, current_user: CurrentUser) -> dict:
        await self.cookbook_service.require_cookbook_role(
            cookbook_id,
            current_user.id,
            [RoleEnum.owner, RoleEnum.contributor],
        )
        source = await self._get_recipe_or_404(recipe_id)
        payload = self.recipe_repo.clone_recipe_payload(source, cookbook_id)

        async with self.conn.transaction():
            created_recipe = await self.recipe_repo.create_recipe(
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
            new_recipe_id = created_recipe.id
            await self.recipe_repo.insert_ingredients(new_recipe_id, payload["ingredients"])
            await self.recipe_repo.insert_instructions(new_recipe_id, payload["instructions"])

        created = await self.recipe_repo.get_recipe(new_recipe_id)
        if created is None:
            raise HTTPException(status_code=500, detail="Recipe copied but could not be loaded")
        await self.refresh_recipe_embedding(new_recipe_id)
        return {"message": "Recipe copied successfully!", "recipe": self._present_recipe(created)}
