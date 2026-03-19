"""Recipe API tests (authenticated)."""

import json

from fastapi.testclient import TestClient

from .conftest import _register_and_get_token


def test_recipe_list_requires_auth(client: TestClient):
    """GET /api/recipe/list/{cookbook_id} without token returns 403."""
    r = client.get("/api/recipe/list/1")
    assert r.status_code == 401


def test_recipe_list_for_cookbook(client: TestClient):
    """GET /api/recipe/list/{cookbook_id} returns array (may be empty)."""
    token = _register_and_get_token(client, "recelist_user")
    create_r = client.post(
        "/api/cookbook/create",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"name": "Recipe List Book", "owner_id": 1, "categories": ["Main"]},
    )
    book_id = create_r.json()["cookbook"]["id"]
    r = client.get(
        f"/api/recipe/list/{book_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_recipe_get_404(client: TestClient):
    """GET /api/recipe/get/99999 returns 404 when recipe does not exist."""
    token = _register_and_get_token(client, "recget404_user")
    create_r = client.post(
        "/api/cookbook/create",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"name": "Recipe 404 Book", "owner_id": 1, "categories": ["Main"]},
    )
    book_id = create_r.json()["cookbook"]["id"]
    r = client.get(
        "/api/recipe/get/99999",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 404


def test_recipe_create_and_get(client: TestClient):
    """Create recipe then GET returns it."""
    token = _register_and_get_token(client, "reccreate_user")
    create_r = client.post(
        "/api/cookbook/create",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"name": "Create Recipe Book", "owner_id": 1, "categories": ["Main"]},
    )
    book_id = create_r.json()["cookbook"]["id"]
    # Need creator_id from /me
    me_r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    creator_id = me_r.json()["user"]["id"]

    recipe_payload = {
        "name": "Test Recipe",
        "description": "A test",
        "notes": None,
        "servings": 4,
        "creator_id": creator_id,
        "category": "Main",
        "image_url": None,
        "tags": [],
        "cookbook_id": book_id,
        "ingredients": [{"amount": 1.0, "unit": "cup", "name": "Flour"}],
        "instructions": [
            {"instruction_number": 1, "instruction_text": "Mix ingredients."},
        ],
    }
    create_recipe_r = client.post(
        f"/api/recipe/create/{book_id}",
        headers={"Authorization": f"Bearer {token}"},
        # Endpoint expects `recipe` as Form field (a JSON string).
        data={"recipe": json.dumps(recipe_payload)},
    )
    assert create_recipe_r.status_code == 200
    data = create_recipe_r.json()
    assert "recipe" in data
    recipe_id = data["recipe"]["id"]

    get_r = client.get(
        f"/api/recipe/get/{recipe_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert get_r.status_code == 200
    assert get_r.json()["name"] == "Test Recipe"
