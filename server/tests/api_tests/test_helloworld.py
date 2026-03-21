"""Public / unauthenticated API tests."""

from fastapi.testclient import TestClient


def test_helloworld(client: TestClient):
    """GET /api/helloworld returns 200 and message."""
    r = client.get("/api/helloworld")
    assert r.status_code == 200
    data = r.json()
    assert data.get("message") == "Hello World"
