import asyncio
import datetime as dt

from schemas.auth import CurrentUser
from services.auth_service import AuthService


class FakeAuthRepo:
    def __init__(self):
        self.touched_tokens: list[str] = []
        self.deleted_tokens: list[str] = []

    async def get_token(self, token: str):
        return {
            "user_id": 9,
            "created_dttm": dt.datetime.now(dt.timezone.utc),
        }

    async def delete_token(self, token: str) -> None:
        self.deleted_tokens.append(token)

    async def touch_token(self, token: str) -> None:
        self.touched_tokens.append(token)

    async def get_user_by_id(self, user_id: int):
        return {
            "user_id": user_id,
            "username": "alice",
            "email": "alice@example.com",
        }


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
