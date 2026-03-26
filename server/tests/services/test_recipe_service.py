import asyncio
from io import BytesIO

from fastapi import UploadFile
from schemas.auth import CurrentUser
from schemas.cookbook import CookbookRoleRecord, RoleEnum
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
        self.created_image_url: str | None = None
        self.updated_image_url: str | None = None
        self.stored_recipes: dict[int, RecipeMetadata] = {}
        self.embedding_updates: list[tuple[int, list[float] | None]] = []

    async def create_recipe(self, **kwargs):
        self.create_creator_id = kwargs["creator_id"]
        self.created_image_url = kwargs["image_url"]
        recipe = RecipeMetadata(
            id=self.created_recipe_id,
            name=kwargs["name"],
            ingredients=[],
            instructions=[],
            notes=kwargs["notes"],
            description=kwargs["description"],
            servings=kwargs["servings"],
            creator_id=kwargs["creator_id"],
            category=kwargs["category"],
            image_url=kwargs["image_url"],
            tags=kwargs["tags"],
            cookbook_id=kwargs["cookbook_id"],
            modified_at=None,
        )
        self.stored_recipes[self.created_recipe_id] = recipe
        return recipe

    async def update_recipe(self, **kwargs):
        self.updated_image_url = kwargs["image_url"]
        recipe = RecipeMetadata(
            id=kwargs["recipe_id"],
            name=kwargs["name"],
            ingredients=[],
            instructions=[],
            notes=kwargs["notes"],
            description=kwargs["description"],
            servings=kwargs["servings"],
            creator_id=kwargs["creator_id"],
            category=kwargs["category"],
            image_url=kwargs["image_url"],
            tags=kwargs["tags"],
            cookbook_id=kwargs["cookbook_id"],
            modified_at=None,
        )
        self.stored_recipes[kwargs["recipe_id"]] = recipe
        return recipe

    async def insert_ingredients(self, recipe_id: int, ingredients):
        self.ingredient_count = len(ingredients)

    async def insert_instructions(self, recipe_id: int, instructions):
        self.instruction_count = len(instructions)

    async def get_recipe(self, recipe_id: int):
        if recipe_id in self.stored_recipes:
            stored = self.stored_recipes[recipe_id]
            return stored.model_copy(
                update={
                    "ingredients": [Ingredient(amount=1.0, unit="cup", name="sugar")],
                    "instructions": [Instruction(instruction_number=1, instruction_text="Mix")],
                }
            )
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
            image_url="recipes/3/original.png",
            tags=["sweet"],
            cookbook_id=3,
            modified_at=None,
        )

    async def get_recipe_cookbook_id(self, recipe_id: int):
        return 3

    async def replace_ingredients(self, recipe_id: int, ingredients):
        self.replaced_ingredients = len(ingredients)

    async def replace_instructions(self, recipe_id: int, instructions):
        self.replaced_instructions = len(instructions)

    async def list_recipes(self, cookbook_id: int):
        return [
            RecipeMetadata(
                id=1,
                name="Brownies",
                ingredients=[Ingredient(amount=1.0, unit="cup", name="sugar")],
                instructions=[Instruction(instruction_number=1, instruction_text="Mix")],
                notes=None,
                description=None,
                servings=8,
                creator_id=22,
                category="Dessert",
                image_url="recipes/3/list.png",
                tags=["sweet"],
                cookbook_id=cookbook_id,
                modified_at=None,
            )
        ]

    async def update_recipe_embedding(self, recipe_id: int, embedding: list[float] | None):
        self.embedding_updates.append((recipe_id, embedding))

    async def list_recipe_ids_missing_embeddings(self):
        return [17, 18]

    async def list_accessible_recipe_ids_for_user(self, user_id: int):
        assert user_id == 22
        return [17, 18]


class FakeCookbookRepo:
    async def get_user_role(self, cookbook_id: int, user_id: int):
        return CookbookRoleRecord(role=RoleEnum.owner)


class FakeStorageService:
    def __init__(self):
        self.uploaded: list[tuple[str | None, int | None]] = []
        self.deleted: list[str] = []
        self.signed: list[str] = []

    async def upload_recipe_image(self, file: UploadFile, cookbook_id: int | None = None) -> str:
        self.uploaded.append((file.filename, cookbook_id))
        return f"recipes/{cookbook_id}/uploaded.png"

    def build_presigned_get_url(self, key: str) -> str:
        self.signed.append(key)
        return f"http://public.example/{key}?signed=1"

    def delete_object(self, key: str) -> None:
        self.deleted.append(key)


def test_create_recipe_uses_authenticated_user_as_creator():
    async def run():
        recipe_repo = FakeRecipeRepo()
        storage_service = FakeStorageService()
        service = RecipeService(FakeConn(), recipe_repo, FakeCookbookRepo(), storage_service)
        from services import recipe_service as recipe_service_module
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

        async def fake_embed_text(text: str, model: str | None = None) -> list[float]:
            return [0.1] * 1536

        recipe_service_module.get_embedding_model = lambda: "embed-model"
        recipe_service_module.embed_text = fake_embed_text

        created = await service.create_recipe(3, recipe, current_user)

        assert created["recipe"].creator_id == 22
        assert recipe_repo.create_creator_id == 22
        assert created["recipe"].image_url is None
        assert recipe_repo.embedding_updates == [(17, [0.1] * 1536)]

    asyncio.run(run())


def test_create_recipe_uploads_image_and_returns_presigned_url():
    async def run():
        recipe_repo = FakeRecipeRepo()
        storage_service = FakeStorageService()
        service = RecipeService(FakeConn(), recipe_repo, FakeCookbookRepo(), storage_service)
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
        image_file = UploadFile(filename="brownies.png", file=BytesIO(b"png"))

        created = await service.create_recipe(3, recipe, current_user, image_file)

        assert recipe_repo.created_image_url == "recipes/3/uploaded.png"
        assert created["recipe"].image_url == "http://public.example/recipes/3/uploaded.png?signed=1"
        assert storage_service.uploaded == [("brownies.png", 3)]

    asyncio.run(run())


def test_edit_recipe_replaces_image_and_deletes_previous_object():
    async def run():
        recipe_repo = FakeRecipeRepo()
        storage_service = FakeStorageService()
        service = RecipeService(FakeConn(), recipe_repo, FakeCookbookRepo(), storage_service)
        from services import recipe_service as recipe_service_module
        current_user = CurrentUser(id=22, username="chef", email="chef@example.com")
        recipe = RecipeMetadata(
            id=17,
            name="Brownies",
            ingredients=[Ingredient(amount=1.0, unit="cup", name="sugar")],
            instructions=[Instruction(instruction_number=1, instruction_text="Mix")],
            notes=None,
            description=None,
            servings=8,
            creator_id=22,
            category="Dessert",
            image_url=None,
            tags=["sweet"],
            cookbook_id=3,
            modified_at=None,
        )
        image_file = UploadFile(filename="new.png", file=BytesIO(b"png"))

        async def fake_embed_text(text: str, model: str | None = None) -> list[float]:
            return [0.2] * 1536

        recipe_service_module.get_embedding_model = lambda: "embed-model"
        recipe_service_module.embed_text = fake_embed_text

        updated = await service.edit_recipe(recipe, current_user, image_file)

        assert recipe_repo.updated_image_url == "recipes/3/uploaded.png"
        assert storage_service.deleted == ["recipes/3/original.png"]
        assert updated["recipe"].image_url == "http://public.example/recipes/3/uploaded.png?signed=1"
        assert recipe_repo.embedding_updates == [(17, [0.2] * 1536)]

    asyncio.run(run())


def test_get_and_list_recipes_return_presigned_image_urls():
    async def run():
        recipe_repo = FakeRecipeRepo()
        storage_service = FakeStorageService()
        service = RecipeService(FakeConn(), recipe_repo, FakeCookbookRepo(), storage_service)
        current_user = CurrentUser(id=22, username="chef", email="chef@example.com")

        recipe = await service.get_recipe(17)
        recipes = await service.list_recipes(3, current_user)

        assert recipe.image_url == "http://public.example/recipes/3/original.png?signed=1"
        assert recipes[0].image_url == "http://public.example/recipes/3/list.png?signed=1"

    asyncio.run(run())


def test_backfill_missing_embeddings_updates_all_missing_recipes():
    async def run():
        recipe_repo = FakeRecipeRepo()
        storage_service = FakeStorageService()
        service = RecipeService(FakeConn(), recipe_repo, FakeCookbookRepo(), storage_service)
        from services import recipe_service as recipe_service_module

        async def fake_embed_text(text: str, model: str | None = None) -> list[float]:
            return [0.3] * 1536

        recipe_service_module.get_embedding_model = lambda: "embed-model"
        recipe_service_module.embed_text = fake_embed_text

        updated = await service.backfill_missing_embeddings()

        assert updated == 2
        assert recipe_repo.embedding_updates == [
            (17, [0.3] * 1536),
            (18, [0.3] * 1536),
        ]

    asyncio.run(run())


def test_reembed_recipes_for_user_updates_accessible_recipes():
    async def run():
        recipe_repo = FakeRecipeRepo()
        storage_service = FakeStorageService()
        service = RecipeService(FakeConn(), recipe_repo, FakeCookbookRepo(), storage_service)
        from services import recipe_service as recipe_service_module

        async def fake_embed_text(text: str, model: str | None = None) -> list[float]:
            return [0.4] * 1536

        recipe_service_module.get_embedding_model = lambda: "embed-model"
        recipe_service_module.embed_text = fake_embed_text

        current_user = CurrentUser(id=22, username="chef", email="chef@example.com")
        result = await service.reembed_recipes_for_user(current_user)

        assert result == {"processed_count": 2, "updated_count": 2}
        assert recipe_repo.embedding_updates == [
            (17, [0.4] * 1536),
            (18, [0.4] * 1536),
        ]

    asyncio.run(run())
