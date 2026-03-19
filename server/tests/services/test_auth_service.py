import asyncio
import datetime as dt

import pytest
from fastapi import HTTPException

from schemas.auth import AuthLoginRecord, AuthTokenRecord, AuthUserRecord, CurrentUser, LoginRequest, RegisterRequest
from services.auth_service import AuthService, PasswordHashService


class FakeAuthRepo:
    def __init__(self):
        self.touched_tokens: list[str] = []
        self.deleted_tokens: list[str] = []
        self.inserted_tokens: list[tuple[str, int]] = []
        self.created_user_args: tuple[str, str, str] | None = None
        self.login_user: AuthLoginRecord | None = None

    async def get_token(self, token: str):
        return AuthTokenRecord(
            user_id=9,
            created_at=dt.datetime.now(dt.timezone.utc),
        )

    async def delete_token(self, token: str) -> None:
        self.deleted_tokens.append(token)

    async def touch_token(self, token: str) -> None:
        self.touched_tokens.append(token)

    async def get_user_by_id(self, user_id: int):
        return AuthUserRecord(
            id=user_id,
            username="alice",
            email="alice@example.com",
        )

    async def create_user(self, username: str, password_hash: str, email: str):
        self.created_user_args = (username, password_hash, email)
        return AuthUserRecord(
            id=12,
            username=username,
            email=email,
        )

    async def insert_token(self, token: str, user_id: int) -> None:
        self.inserted_tokens.append((token, user_id))

    async def fetch_user_for_login(self, username: str | None, email: str | None):
        return self.login_user


def test_authenticate_token_returns_current_user_and_refreshes_token():
    async def run():
        repo = FakeAuthRepo()
        service = AuthService(repo)

        user = await service.authenticate_token("token-123")

        assert isinstance(user, CurrentUser)
        assert user.id == 9
        assert repo.touched_tokens == ["token-123"]
        assert repo.deleted_tokens == []

    asyncio.run(run())


def test_register_hashes_password_before_persisting():
    async def run():
        repo = FakeAuthRepo()
        service = AuthService(repo)

        response = await service.register(
            RegisterRequest(username="alice", email="alice@example.com", password="secret-pass"),
        )

        assert repo.created_user_args is not None
        username, password_hash, email = repo.created_user_args
        assert username == "alice"
        assert email == "alice@example.com"
        assert password_hash != "secret-pass"
        assert PasswordHashService().verify_password("secret-pass", password_hash)
        assert response["user"] == {
            "id": 12,
            "username": "alice",
            "email": "alice@example.com",
        }
        assert repo.inserted_tokens[0][1] == 12

    asyncio.run(run())


def test_login_verifies_argon2id_hash_and_returns_public_user_only():
    async def run():
        repo = FakeAuthRepo()
        hasher = PasswordHashService()
        repo.login_user = AuthLoginRecord(
            id=7,
            username="alice",
            email="alice@example.com",
            password_hash=hasher.hash_password("correct-password"),
        )
        service = AuthService(repo, password_hasher=hasher)

        response = await service.login(
            LoginRequest(username="alice", email=None, password="correct-password"),
        )

        assert response["user"] == {
            "id": 7,
            "username": "alice",
            "email": "alice@example.com",
        }
        assert "password" not in response["user"]
        assert repo.inserted_tokens[0][1] == 7

    asyncio.run(run())


def test_login_rejects_invalid_password():
    async def run():
        repo = FakeAuthRepo()
        hasher = PasswordHashService()
        repo.login_user = AuthLoginRecord(
            id=7,
            username="alice",
            email="alice@example.com",
            password_hash=hasher.hash_password("correct-password"),
        )
        service = AuthService(repo, password_hasher=hasher)

        with pytest.raises(HTTPException) as exc:
            await service.login(
                LoginRequest(username="alice", email=None, password="wrong-password"),
            )

        assert exc.value.status_code == 401

    asyncio.run(run())
