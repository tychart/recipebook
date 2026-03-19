"""
Shared fixtures and helpers for API tests.

Server APIs are defined in:
  - server/main.py          -> app entry, /api/helloworld
  - server/routers/auth.py  -> /api/auth (login, register, logout, me)
  - server/routers/cookbooks.py -> /api/cookbook (create, get, list, edit, delete, share)
  - server/routers/recipes.py   -> /api/recipe (list, get, create, edit, delete, copy)
  - server/routers/storage.py  -> /api/uploads
  - server/routers/generate.py -> (generation endpoints)
  - server/routers/ocr.py      -> (OCR endpoints)

Requires: DATABASE_URL set and PostgreSQL running (and migrations applied).
S3 is optional for these tests (ensure_bucket_exists skips if S3_KEY/S3_SECRET unset).
"""
import uuid

import pytest
from fastapi.testclient import TestClient

from main import app


def _unique_user(base_username: str = "testuser", password: str = "testpass123"):
    """Return a unique username/email dict so tests don't collide across runs."""
    suffix = uuid.uuid4().hex[:8]
    return {
        "username": f"{base_username}_{suffix}",
        "email": f"test_{suffix}@example.com",
        "password": password,
    }


def _register_and_get_token(
    client: TestClient,
    base_username: str = "cookbook_user",
    password: str = "pass",
) -> str:
    """Register a user and return auth token."""
    payload = _unique_user(base_username=base_username, password=password)

    r_register = client.post("/api/auth/register", json=payload)
    assert r_register.status_code == 200, r_register.text

    r_login = client.post(
        "/api/auth/login",
        json={"username": payload["username"], "password": payload["password"]},
    )
    assert r_login.status_code == 200, r_login.text
    return r_login.json()["token"]


@pytest.fixture(scope="module")
def client():
    """One TestClient for the module; lifespan runs on first request."""
    with TestClient(app) as c:
        yield c
