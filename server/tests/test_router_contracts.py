from fastapi import FastAPI
from fastapi.testclient import TestClient

from dependencies.auth import get_current_user_dep
from dependencies.services import get_recipe_service
from routers import auth as auth_router
from routers import recipes as recipe_router
from schemas.auth import CurrentUser


class FakeRecipeService:
    async def create_recipe(self, cookbook_id, recipe, current_user):
        return {
            "message": "Recipe created successfully!",
            "recipe": {
                "id": 12,
                "name": recipe.name,
                "ingredients": [ingredient.dict() for ingredient in recipe.ingredients],
                "instructions": [instruction.dict() for instruction in recipe.instructions],
                "notes": recipe.notes,
                "description": recipe.description,
                "servings": recipe.servings,
                "creator_id": current_user.id,
                "category": recipe.category,
                "image_url": recipe.image_url,
                "tags": recipe.tags,
                "cookbook_id": cookbook_id,
                "modified_at": None,
            },
        }


def test_auth_me_route_returns_legacy_shape():
    app = FastAPI()
    app.include_router(auth_router.router)
    app.dependency_overrides[get_current_user_dep] = lambda: CurrentUser(
        id=1,
        username="alice",
        email="alice@example.com",
    )
    client = TestClient(app)

    response = client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.json() == {
        "user": {
            "id": 1,
            "username": "alice",
            "email": "alice@example.com",
        }
    }


def test_recipe_create_route_keeps_existing_path_and_response_shape():
    app = FastAPI()
    app.include_router(recipe_router.router)
    app.dependency_overrides[get_current_user_dep] = lambda: CurrentUser(
        id=5,
        username="chef",
        email="chef@example.com",
    )
    app.dependency_overrides[get_recipe_service] = lambda: FakeRecipeService()
    client = TestClient(app)

    response = client.post(
        "/api/recipe/create/3",
        json={
            "name": "Brownies",
            "ingredients": [{"amount": 1, "unit": "cup", "name": "sugar"}],
            "instructions": [{"instruction_number": 1, "instruction_text": "Mix"}],
            "notes": None,
            "description": "Rich and fudgy",
            "servings": 8,
            "creator_id": 999,
            "category": "Dessert",
            "image_url": None,
            "tags": ["sweet"],
            "cookbook_id": 3,
            "modified_at": None,
        },
    )

    body = response.json()

    assert response.status_code == 200
    assert body["message"] == "Recipe created successfully!"
    assert body["recipe"]["id"] == 12
    assert body["recipe"]["creator_id"] == 5
