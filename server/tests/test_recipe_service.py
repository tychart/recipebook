import asyncio

from schemas.auth import CurrentUser
from schemas.recipe import Ingredient, Instruction, RecipeMetadata
from services.recipe_service import RecipeService


class FakeTransaction:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False


class FakeConn:
    def transaction(self):
        return FakeTransaction()


class FakeRecipeRepo:
    def __init__(self):
        self.create_creator_id: int | None = None
        self.created_recipe_id = 17

    async def create_recipe(self, **kwargs):
        self.create_creator_id = kwargs["creator_id"]
        return {"recipe_id": self.created_recipe_id}

    async def insert_ingredients(self, recipe_id: int, ingredients):
        self.ingredient_count = len(ingredients)

    async def insert_instructions(self, recipe_id: int, instructions):
        self.instruction_count = len(instructions)

    async def get_recipe(self, recipe_id: int):
        return RecipeMetadata(
            id=recipe_id,
            name="Brownies",
            ingredients=[Ingredient(amount=1.0, unit="cup", name="sugar")],
            instructions=[Instruction(instruction_number=1, instruction_text="Mix")],
            notes=None,
            description=None,
            servings=8,
            creator_id=self.create_creator_id,
            category="Dessert",
            image_url=None,
            tags=["sweet"],
            cookbook_id=3,
            modified_at=None,
        )


class FakeCookbookRepo:
    async def get_user_role(self, cookbook_id: int, user_id: int):
        return {"role": "owner"}


def test_create_recipe_uses_authenticated_user_as_creator():
    async def run():
        recipe_repo = FakeRecipeRepo()
        service = RecipeService(FakeConn(), recipe_repo, FakeCookbookRepo())
        current_user = CurrentUser(id=22, username="chef", email="chef@example.com")
        recipe = RecipeMetadata(
            id=None,
            name="Brownies",
            ingredients=[Ingredient(amount=1.0, unit="cup", name="sugar")],
            instructions=[Instruction(instruction_number=1, instruction_text="Mix")],
            notes=None,
            description=None,
            servings=8,
            creator_id=999,
            category="Dessert",
            image_url=None,
            tags=["sweet"],
            cookbook_id=3,
            modified_at=None,
        )

        created = await service.create_recipe(3, recipe, current_user)

        assert created["recipe"].creator_id == 22
        assert recipe_repo.create_creator_id == 22

    asyncio.run(run())
