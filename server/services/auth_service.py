import datetime as dt
import secrets

import asyncpg
from fastapi import HTTPException

from repositories.auth_repo import AuthRepository
from schemas.auth import CurrentUser, LoginRequest, RegisterRequest, TOKEN_TTL_SECONDS


def _row_to_user(row: asyncpg.Record) -> dict:
    data = dict(row)
    return {
        "id": data["user_id"],
        "username": data["username"],
        "email": data["email"],
    }


class AuthService:
    def __init__(self, repo: AuthRepository):
        self.repo = repo

    async def login(self, body: LoginRequest) -> dict:
        if not body.username and not body.email:
            raise HTTPException(status_code=400, detail="Provide username or email")
        if not body.password:
            raise HTTPException(status_code=400, detail="Password required")

        user_row = await self.repo.fetch_user_for_login(body.username, body.email)
        if user_row is None or user_row["password"] != body.password:
            raise HTTPException(status_code=401, detail="Invalid username/email or password")

        token = secrets.token_urlsafe(32)
        await self.repo.insert_token(token, user_row["user_id"])
        return {
            "message": "Login successful!",
            "token": token,
            "user": _row_to_user(user_row),
        }

    async def register(self, body: RegisterRequest) -> dict:
        try:
            user_row = await self.repo.create_user(body.username, body.password, body.email)
        except asyncpg.UniqueViolationError:
            raise HTTPException(status_code=400, detail="Username or email already in use")

        token = secrets.token_urlsafe(32)
        await self.repo.insert_token(token, user_row["user_id"])
        return {
            "message": "Registration successful!",
            "token": token,
            "user": _row_to_user(user_row),
        }

    async def logout(self, token: str | None) -> dict:
        if token:
            await self.repo.delete_token(token)
        return {"message": "Logged out successfully!"}

    async def authenticate_token(self, token: str) -> CurrentUser:
        token_row = await self.repo.get_token(token)
        if token_row is None:
            raise HTTPException(status_code=401, detail="Not authenticated")

        created = token_row["created_dttm"]
        now = dt.datetime.now(dt.timezone.utc)
        if created.tzinfo is None:
            created = created.replace(tzinfo=dt.timezone.utc)
        age_seconds = (now - created).total_seconds()
        if age_seconds > TOKEN_TTL_SECONDS:
            await self.repo.delete_token(token)
            raise HTTPException(status_code=401, detail="Token expired, please reauthenticate")

        await self.repo.touch_token(token)
        user_row = await self.repo.get_user_by_id(token_row["user_id"])
        if user_row is None:
            raise HTTPException(status_code=401, detail="User not found")

        return CurrentUser(
            id=user_row["user_id"],
            username=user_row["username"],
            email=user_row["email"],
        )

    async def get_current_user(self, token: str) -> dict:
        current_user = await self.authenticate_token(token)
        return {
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "email": current_user.email,
            }
        }
