"""Auth API tests: register, login, me, logout."""

from fastapi.testclient import TestClient

from .conftest import _unique_user


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
    payload = _unique_user(base_username="dupuser_api", password="testpass123")
    r1 = client.post("/api/auth/register", json=payload)
    assert r1.status_code == 200, r1.text
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 400
    assert "already" in r.json().get("detail", "").lower()


def test_login(client: TestClient):
    """POST /api/auth/login returns token for valid credentials."""
    payload = _unique_user(base_username="loginuser_api", password="mypass")
    r_reg = client.post("/api/auth/register", json=payload)
    assert r_reg.status_code == 200, r_reg.text
    r = client.post(
        "/api/auth/login",
        json={"username": payload["username"], "password": payload["password"]},
    )
    assert r.status_code == 200
    data = r.json()
    assert "token" in data
    assert data.get("user", {}).get("username") == payload["username"]


def test_login_with_email(client: TestClient):
    """Login with email instead of username works."""
    payload = _unique_user(base_username="emailuser_api", password="pass")
    r_reg = client.post("/api/auth/register", json=payload)
    assert r_reg.status_code == 200, r_reg.text
    r = client.post(
        "/api/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert r.status_code == 200
    assert "token" in r.json()


def test_login_invalid_password(client: TestClient):
    """Login with wrong password returns 401."""
    payload = _unique_user(base_username="wrongpass_user", password="correct")
    r_reg = client.post("/api/auth/register", json=payload)
    assert r_reg.status_code == 200, r_reg.text
    r = client.post(
        "/api/auth/login",
        json={"username": payload["username"], "password": "wrong"},
    )
    assert r.status_code == 401


def test_me_requires_auth(client: TestClient):
    """GET /api/auth/me without token returns 403."""
    r = client.get("/api/auth/me")
    assert r.status_code == 401


def test_me_with_token(client: TestClient):
    """GET /api/auth/me with valid token returns user."""
    payload = _unique_user(base_username="meuser_api", password="pass")
    r_reg = client.post("/api/auth/register", json=payload)
    assert r_reg.status_code == 200, r_reg.text
    login_r = client.post(
        "/api/auth/login",
        json={"username": payload["username"], "password": payload["password"]},
    )
    token = login_r.json()["token"]
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json().get("user", {}).get("username") == payload["username"]


def test_logout(client: TestClient):
    """POST /api/auth/logout with token returns 200."""
    payload = _unique_user(base_username="logoutuser_api", password="pass")
    r_reg = client.post("/api/auth/register", json=payload)
    assert r_reg.status_code == 200, r_reg.text
    login_r = client.post(
        "/api/auth/login",
        json={"username": payload["username"], "password": payload["password"]},
    )
    token = login_r.json()["token"]
    r = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert "message" in r.json()
