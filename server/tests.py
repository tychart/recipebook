"""
API tests for the RecipeBook server backend.

Server APIs are defined in:
  - server/main.py          -> app entry, /api/helloworld
  - server/routers/auth.py  -> /api/auth (login, register, logout, me)
  - server/routers/cookbooks.py -> /api/cookbook (create, get, list, edit, delete, share)
  - server/routers/recipes.py   -> /api/recipe (list, get, create, edit, delete, copy)
  - server/routers/storage.py  -> /api/uploads
  - server/routers/generate.py -> (generation endpoints)
  - server/routers/ocr.py      -> (OCR endpoints)

Run from repo root:  pytest server/tests.py -v
Or from server dir:  pytest tests.py -v
Requires: DATABASE_URL set and PostgreSQL running (and migrations applied).
S3 is optional for these tests (ensure_bucket_exists skips if S3_KEY/S3_SECRET unset).
"""
import sys
import uuid
from pathlib import Path

# Allow importing main from server when running pytest from repo root
_server_dir = Path(__file__).resolve().parent
if str(_server_dir) not in sys.path:
    sys.path.insert(0, str(_server_dir))

import pytest
from fastapi.testclient import TestClient

from main import app


def _unique_user(password: str = "testpass123"):
    """Return a unique username/email dict so tests don't collide across runs."""
    suffix = uuid.uuid4().hex[:8]
    return {
        "username": f"testuser_{suffix}",
        "email": f"test_{suffix}@example.com",
        "password": password,
    }


@pytest.fixture(scope="module")
def client():
    """One TestClient for the module; lifespan runs on first request."""
    with TestClient(app) as c:
        yield c


# ------------------------------
# Public / unauthenticated
# ------------------------------

def test_helloworld(client: TestClient):
    """GET /api/helloworld returns 200 and message."""
    r = client.get("/api/helloworld")
    assert r.status_code == 200
    data = r.json()
    assert data.get("message") == "Hello World"


# ------------------------------
# Auth API: register, login, me, logout
# ------------------------------

def test_register(client: TestClient):
    """POST /api/auth/register creates user and returns token."""
    payload = _unique_user()
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "token" in data
    assert data.get("message") == "Registration successful!"
    user = data.get("user")
    assert user is not None
    assert user.get("username") == payload["username"]
    assert user.get("email") == payload["email"]
    assert "id" in user


def test_register_duplicate_username(client: TestClient):
    """Registering again with same username returns 400."""
    payload = {
        "username": "dupuser_api",
        "email": "dupapi@example.com",
        "password": "testpass123",
    }
    client.post("/api/auth/register", json=payload)
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 400
    assert "already" in r.json().get("detail", "").lower()


def test_login(client: TestClient):
    """POST /api/auth/login returns token for valid credentials."""
    client.post(
        "/api/auth/register",
        json={
            "username": "loginuser_api",
            "email": "loginapi@example.com",
            "password": "mypass",
        },
    )
    r = client.post(
        "/api/auth/login",
        json={"username": "loginuser_api", "password": "mypass"},
    )
    assert r.status_code == 200
    data = r.json()
    assert "token" in data
    assert data.get("user", {}).get("username") == "loginuser_api"


def test_login_with_email(client: TestClient):
    """Login with email instead of username works."""
    client.post(
        "/api/auth/register",
        json={
            "username": "emailuser_api",
            "email": "emailapi@example.com",
            "password": "pass",
        },
    )
    r = client.post(
        "/api/auth/login",
        json={"email": "emailapi@example.com", "password": "pass"},
    )
    assert r.status_code == 200
    assert "token" in r.json()


def test_login_invalid_password(client: TestClient):
    """Login with wrong password returns 401."""
    client.post(
        "/api/auth/register",
        json={
            "username": "wrongpass_user",
            "email": "wrongpass@example.com",
            "password": "correct",
        },
    )
    r = client.post(
        "/api/auth/login",
        json={"username": "wrongpass_user", "password": "wrong"},
    )
    assert r.status_code == 401


def test_me_requires_auth(client: TestClient):
    """GET /api/auth/me without token returns 403."""
    r = client.get("/api/auth/me")
    assert r.status_code == 401


def test_me_with_token(client: TestClient):
    """GET /api/auth/me with valid token returns user."""
    client.post(
        "/api/auth/register",
        json={
            "username": "meuser_api",
            "email": "meapi@example.com",
            "password": "pass",
        },
    )
    login_r = client.post(
        "/api/auth/login",
        json={"username": "meuser_api", "password": "pass"},
    )
    token = login_r.json()["token"]
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json().get("user", {}).get("username") == "meuser_api"


def test_logout(client: TestClient):
    """POST /api/auth/logout with token returns 200."""
    client.post(
        "/api/auth/register",
        json={
            "username": "logoutuser_api",
            "email": "logoutapi@example.com",
            "password": "pass",
        },
    )
    login_r = client.post(
        "/api/auth/login",
        json={"username": "logoutuser_api", "password": "pass"},
    )
    token = login_r.json()["token"]
    r = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert "message" in r.json()


# ------------------------------
# Cookbook API (authenticated)
# ------------------------------

def _register_and_get_token(client: TestClient, username: str = "cookbook_user") -> str:
    """Register a user and return auth token."""
    client.post(
        "/api/auth/register",
        json={
            "username": username,
            "email": f"{username}@example.com",
            "password": "pass",
        },
    )
    r = client.post(
        "/api/auth/login",
        json={"username": username, "password": "pass"},
    )
    assert r.status_code == 200
    return r.json()["token"]


def test_cookbook_list_requires_auth(client: TestClient):
    """GET /api/cookbook/list without token returns 403."""
    r = client.get("/api/cookbook/list")
    assert r.status_code == 401


def test_cookbook_list_empty(client: TestClient):
    """GET /api/cookbook/list with token returns list (may be empty)."""
    token = _register_and_get_token(client, "listuser_api")
    r = client.get(
        "/api/cookbook/list",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_cookbook_create_and_list(client: TestClient):
    """Create cookbook then list returns it."""
    token = _register_and_get_token(client, "createuser_api")
    r = client.post(
        "/api/cookbook/create",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={
            "name": "My Test Cookbook",
            "owner_id": 1,
            "categories": ["Main", "Dessert"],
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert "cookbook" in data
    assert data["cookbook"]["name"] == "My Test Cookbook"
    cookbook_id = data["cookbook"]["id"]

    list_r = client.get(
        "/api/cookbook/list",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_r.status_code == 200
    books = list_r.json()
    ids = [b["id"] for b in books]
    assert cookbook_id in ids


def test_cookbook_get(client: TestClient):
    """GET /api/cookbook/get/{id} returns cookbook for owner."""
    token = _register_and_get_token(client, "getbook_user")
    create_r = client.post(
        "/api/cookbook/create",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"name": "Get Test Book", "owner_id": 1, "categories": ["Main"]},
    )
    cookbook_id = create_r.json()["cookbook"]["id"]
    r = client.get(
        f"/api/cookbook/get/{cookbook_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Get Test Book"


def test_cookbook_get_403(client: TestClient):
    """GET /api/cookbook/get/99999 returns 404 when not found."""
    token = _register_and_get_token(client, "get404_user")
    r = client.get(
        "/api/cookbook/get/99999",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403


# ------------------------------
# Recipe API (authenticated)
# ------------------------------

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
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=recipe_payload,
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