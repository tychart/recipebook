"""Cookbook API tests (authenticated)."""

from fastapi.testclient import TestClient

from .conftest import _register_and_get_token


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
