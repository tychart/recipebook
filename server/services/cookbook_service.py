from fastapi import HTTPException

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from services.auth_service import AuthService

from repositories.cookbook_repo import CookbookRepository
from repositories.recipe_repo import RecipeRepository
from schemas.auth import CurrentUser
from schemas.cookbook import (
    Cookbook,
    CookbookMember,
    RemoveCookbookUserRequest,
    RoleEnum,
    ShareCookbookRequest,
)


import logging

logger = logging.getLogger(__name__)


def _categories_to_text(categories: list[str] | None) -> str:
    if not categories:
        return "Main"
    return ",".join(categories)


class CookbookService:
    def __init__(
        self,
        repo: CookbookRepository,
        auth_service: "AuthService",
        recipe_repo: RecipeRepository | None = None,
    ):
        self.repo = repo
        self.auth_service = auth_service
        self.recipe_repo = recipe_repo

    async def get_cookbook_role(self, cookbook_id: int, user_id: int) -> RoleEnum | None:
        role_record = await self.repo.get_user_role(cookbook_id, user_id)
        if role_record is None:
            return None
        return role_record.role

    async def require_cookbook_role(self, cookbook_id: int, user_id: int, allowed_roles: list[RoleEnum]) -> None:
        role = await self.get_cookbook_role(cookbook_id, user_id)
        if role is None or role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Not allowed for this cookbook")

    async def create_cookbook(self, cookbook: Cookbook, current_user: CurrentUser) -> dict:
        created = await self.repo.create_cookbook(
            cookbook.name,
            current_user.id,
            _categories_to_text(cookbook.categories),
        )
        return {
            "message": "Cookbook created successfully!",
            "cookbook": created.model_dump(),
        }

    async def get_cookbook(self, cookbook_id: int, current_user: CurrentUser) -> dict:
        role = await self.get_cookbook_role(cookbook_id, current_user.id)
        if role is None or role not in (RoleEnum.owner, RoleEnum.contributor, RoleEnum.viewer):
            raise HTTPException(status_code=403, detail="Not allowed for this cookbook")
        cookbook = await self.repo.get_cookbook(cookbook_id)
        if cookbook is None:
            raise HTTPException(status_code=404, detail="Cookbook not found")
        contributors_rows, viewers_rows = await self.repo.list_cookbook_contributors_and_viewers(cookbook_id)
        return {
            **cookbook.model_dump(),
            "current_user_role": role.value,
            "contributors": [
                CookbookMember(user_id=uid, username=name, email=email).model_dump()
                for uid, name, email in contributors_rows
            ],
            "viewers": [
                CookbookMember(user_id=uid, username=name, email=email).model_dump()
                for uid, name, email in viewers_rows
            ],
        }

    async def list_cookbooks(self, current_user: CurrentUser) -> list[dict]:
        cookbooks = await self.repo.list_cookbooks_for_user(current_user.id)
        result: list[dict] = []
        for cookbook in cookbooks:
            role = await self.get_cookbook_role(cookbook.id, current_user.id)
            result.append(
                {
                    **cookbook.model_dump(),
                    "current_user_role": role.value if role is not None else None,
                }
            )
        return result

    async def edit_cookbook(self, cookbook: Cookbook, current_user: CurrentUser) -> dict:
        if cookbook.id is None:
            raise HTTPException(status_code=400, detail="Cookbook id is required for edit")
        await self.require_cookbook_role(cookbook.id, current_user.id, [RoleEnum.owner])

        existing = await self.repo.get_cookbook(cookbook.id)
        if existing is None:
            raise HTTPException(status_code=404, detail="Cookbook not found")

        updated = await self.repo.update_cookbook(
            cookbook.id,
            cookbook.name,
            existing.owner_id,
            _categories_to_text(cookbook.categories),
        )
        return {
            "message": "Cookbook edited successfully!",
            "cookbook": updated.model_dump(),
        }

    async def delete_cookbook(self, cookbook_id: int, current_user: CurrentUser) -> dict:
        await self.require_cookbook_role(cookbook_id, current_user.id, [RoleEnum.owner])
        await self.repo.delete_cookbook_ingredients(cookbook_id)
        await self.repo.delete_cookbook_instructions(cookbook_id)
        await self.repo.delete_cookbook_recipes(cookbook_id)
        await self.repo.delete_cookbook_users(cookbook_id)
        deleted_id = await self.repo.delete_cookbook(cookbook_id)
        if deleted_id is None:
            raise HTTPException(status_code=404, detail="Cookbook not found")
        return {"message": "Cookbook deleted successfully!"}

    async def share_cookbook(self, body: ShareCookbookRequest, current_user: CurrentUser) -> dict:
        logger.info(f"share_cookbook called: book_id={body.book_id}, role={body.role}, email='{body.email}'")
        
        await self.require_cookbook_role(body.book_id, current_user.id, [RoleEnum.owner])

        if body.role == RoleEnum.owner:
            logger.warning(f"Invalid role 'owner' attempted for book {body.book_id}")
            raise HTTPException(status_code=400, detail="Cannot share as owner")

        owner_email = current_user.email.strip().lower()
        recipient_email = str(body.email).strip().lower()
        
        logger.info(f"Normalized emails - owner: '{owner_email}', recipient: '{recipient_email}'")
        
        if recipient_email == owner_email:
            logger.warning(f"Self-share attempt blocked for book {body.book_id}")
            raise HTTPException(status_code=400, detail="Owner already has access")

        logger.info(f"Looking up user by email: '{recipient_email}'")
        user = await self.auth_service.get_user_record_by_email(recipient_email)
        
        if user is None:
            logger.error(f"User NOT FOUND for email: '{recipient_email}'")
            raise HTTPException(status_code=404, detail="User not found")
        
        logger.info(f"User found: id={user.id}, email='{user.email}', username='{user.username}'")
        
        await self.repo.upsert_shared_user(body.book_id, user.id, body.role.value)
        
        logger.info(f"Successfully shared book {body.book_id} with user {user.id} as {body.role.value}")
        
        return {
            "message": "Cookbook shared successfully!",
            "book_id": body.book_id,
            "user_id": user.id,
            "email": user.email,
            "role": body.role.value,
        }

    async def remove_cookbook_user(self, body: RemoveCookbookUserRequest, current_user: CurrentUser) -> dict:
        await self.require_cookbook_role(body.book_id, current_user.id, [RoleEnum.owner])
        cookbook = await self.repo.get_cookbook(body.book_id)
        if cookbook is None:
            raise HTTPException(status_code=404, detail="Cookbook not found")
        if body.user_id == cookbook.owner_id:
            raise HTTPException(status_code=400, detail="Cannot remove the cookbook owner")
        shared_role = await self.repo.get_shared_user_role(body.book_id, body.user_id)
        if shared_role is None:
            raise HTTPException(status_code=404, detail="User is not a member of this cookbook")
        if self.recipe_repo is None:
            raise RuntimeError("CookbookService requires recipe_repo for remove_cookbook_user")
        async with self.repo.conn.transaction():
            if shared_role == RoleEnum.contributor:
                await self.recipe_repo.reassign_recipe_creators_in_cookbook(
                    body.book_id,
                    body.user_id,
                    cookbook.owner_id,
                )
            removed = await self.repo.delete_shared_user(body.book_id, body.user_id)
        if not removed:
            raise HTTPException(status_code=404, detail="User is not a member of this cookbook")
        return {"message": "User removed from cookbook successfully!"}