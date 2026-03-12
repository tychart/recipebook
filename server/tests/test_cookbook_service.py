import asyncio

import pytest
from fastapi import HTTPException

from schemas.auth import CurrentUser
from schemas.cookbook import Cookbook, RoleEnum
from services.cookbook_service import CookbookService


class FakeCookbookRepo:
    def __init__(self, role: str | None):
        self.role = role
        self.created_with_owner_id: int | None = None

    async def get_user_role(self, cookbook_id: int, user_id: int):
        if self.role is None:
            return None
        return {"role": self.role}

    async def create_cookbook(self, name: str, owner_id: int, categories: str):
        self.created_with_owner_id = owner_id
        return {
            "book_id": 4,
            "book_name": name,
            "owner_id": owner_id,
            "created_dttm": None,
            "categories": categories,
        }


def test_require_cookbook_role_rejects_disallowed_role():
    async def run():
        service = CookbookService(FakeCookbookRepo("viewer"))
        with pytest.raises(HTTPException):
            await service.require_cookbook_role(1, 2, [RoleEnum.owner, RoleEnum.contributor])

    asyncio.run(run())


def test_create_cookbook_uses_authenticated_user_as_owner():
    async def run():
        repo = FakeCookbookRepo("owner")
        service = CookbookService(repo)
        cookbook = Cookbook(id=None, name="Favorites", owner_id=999, categories=["Main"], created_at=None)
        current_user = CurrentUser(id=42, username="bob", email="bob@example.com")

        created = await service.create_cookbook(cookbook, current_user)

        assert created["cookbook"]["owner_id"] == 42
        assert repo.created_with_owner_id == 42

    asyncio.run(run())
