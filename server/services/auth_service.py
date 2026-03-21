import datetime as dt
import secrets

import asyncpg
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from fastapi import HTTPException

from repositories.auth_repo import AuthRepository
from schemas.auth import AuthUserRecord, CurrentUser, LoginRequest, RegisterRequest, TOKEN_TTL_SECONDS


def _user_to_dict(user: AuthUserRecord) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
    }


class PasswordHashService:
    def __init__(self):
        self._hasher = PasswordHasher(
            time_cost=3,
            memory_cost=65536,
            parallelism=4,
            hash_len=32,
            salt_len=16,
        )

    def hash_password(self, plain_password: str) -> str:
        return self._hasher.hash(plain_password)

    def verify_password(self, plain_password: str, password_hash: str) -> bool:
        try:
            return self._hasher.verify(password_hash, plain_password)
        except (InvalidHashError, VerifyMismatchError):
            return False


class AuthService:
    def __init__(self, repo: AuthRepository, password_hasher: PasswordHashService | None = None):
        self.repo = repo
        self.password_hasher = password_hasher or PasswordHashService()

    async def login(self, body: LoginRequest) -> dict:
        if not body.username and not body.email:
            raise HTTPException(status_code=400, detail="Provide username or email")
        if not body.password:
            raise HTTPException(status_code=400, detail="Password required")

        user = await self.repo.fetch_user_for_login(body.username, body.email)
        if user is None or not self.password_hasher.verify_password(body.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid username/email or password")

        token = secrets.token_urlsafe(32)
        await self.repo.insert_token(token, user.id)
        return {
            "message": "Login successful!",
            "token": token,
            "user": _user_to_dict(user),
        }

    async def register(self, body: RegisterRequest) -> dict:
        password_hash = self.password_hasher.hash_password(body.password)
        try:
            user = await self.repo.create_user(body.username, password_hash, body.email)
        except asyncpg.UniqueViolationError:
            raise HTTPException(status_code=400, detail="Username or email already in use")

        token = secrets.token_urlsafe(32)
        await self.repo.insert_token(token, user.id)
        return {
            "message": "Registration successful!",
            "token": token,
            "user": _user_to_dict(user),
        }

    async def logout(self, token: str | None) -> dict:
        if token:
            await self.repo.delete_token(token)
        return {"message": "Logged out successfully!"}

    async def authenticate_token(self, token: str) -> CurrentUser:
        token_row = await self.repo.get_token(token)
        if token_row is None:
            raise HTTPException(status_code=401, detail="Not authenticated")

        created = token_row.created_at
        now = dt.datetime.now(dt.timezone.utc)
        if created.tzinfo is None:
            created = created.replace(tzinfo=dt.timezone.utc)
        age_seconds = (now - created).total_seconds()
        if age_seconds > TOKEN_TTL_SECONDS:
            await self.repo.delete_token(token)
            raise HTTPException(status_code=401, detail="Token expired, please reauthenticate")

        await self.repo.touch_token(token)
        user = await self.repo.get_user_by_id(token_row.user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")

        return CurrentUser(
            id=user.id,
            username=user.username,
            email=user.email,
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

    async def get_user_by_email(self, email: str) -> dict:
        user = await self.repo.get_user_by_email(email)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "id": user.id,
            "email": user.email,
            "username": user.username,
        }
