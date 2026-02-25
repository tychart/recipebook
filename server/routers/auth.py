import datetime as dt
import secrets
from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Token expires after this long; refresh extends from current time
TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60  # 7 days
from pydantic import BaseModel
from typing import List
import asyncpg

from database import get_db

# Bearer token security scheme for Swagger UI
bearer_scheme = HTTPBearer()

router = APIRouter(
    prefix="/api/auth",
    tags=["authentication"],
)


class User(BaseModel):
    id: int | None = None
    username: str
    email: str
    password: str


class AuthToken(BaseModel):
    id: int | None = None
    user_id: int
    token: str
    created_at: dt.datetime


class LoginRequest(BaseModel):
    username: str | None = None
    email: str | None = None
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


def _row_to_user(row: asyncpg.Record) -> dict:
    """Map DB Users row to API user (no password)."""
    return {
        "id": row["user_id"],
        "username": row["username"],
        "email": row["email"],
    }


def _bearer_token(authorization: str | None) -> str | None:
    """Extract Bearer token from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization[7:].strip() or None


@router.post("/login")
async def login(body: LoginRequest, db: asyncpg.Connection = Depends(get_db)):
    if not body.username and not body.email:
        raise HTTPException(status_code=400, detail="Provide username or email")
    if not body.password:
        raise HTTPException(status_code=400, detail="Password required")

    user_row = await db.fetchrow(
        """
        SELECT User_ID, Username, Email, Password
        FROM Users
        WHERE (Username = $1 OR Email = $2)
        """,
        body.username or body.email,
        body.email or body.username,
    )
    if user_row is None:
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    if user_row["password"] != body.password:
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    token = secrets.token_urlsafe(32)
    await db.execute(
        "INSERT INTO AuthToken (Authtoken, User_ID) VALUES ($1, $2)",
        token,
        user_row["user_id"],
    )
    return {
        "message": "Login successful!",
        "token": token,
        "user": _row_to_user(user_row),
    }


@router.post("/register")
async def register(body: RegisterRequest, db: asyncpg.Connection = Depends(get_db)):
    try:
        user_row = await db.fetchrow(
            """
            INSERT INTO Users (Username, Password, Email)
            VALUES ($1, $2, $3)
            RETURNING User_ID, Username, Email
            """,
            body.username,
            body.password,
            body.email,
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=400, detail="Username or email already in use")

    token = secrets.token_urlsafe(32)
    await db.execute(
        "INSERT INTO AuthToken (Authtoken, User_ID) VALUES ($1, $2)",
        token,
        user_row["user_id"],
    )
    return {
        "message": "Registration successful!",
        "token": token,
        "user": _row_to_user(user_row),
    }


@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False)),
    db: asyncpg.Connection = Depends(get_db),
):
    if credentials:
        token = credentials.credentials.strip()
        await db.execute("DELETE FROM AuthToken WHERE Authtoken = $1", token)
    return {"message": "Logged out successfully!"}


@router.get("/me")
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: asyncpg.Connection = Depends(get_db),
):
    token = credentials.credentials.strip()

    token_row = await db.fetchrow(
        "SELECT User_ID, Created_DtTm FROM AuthToken WHERE Authtoken = $1",
        token,
    )
    if token_row is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    created = token_row["created_dttm"]
    now = dt.datetime.now(dt.timezone.utc)
    # Make created timezone-aware if DB returned naive datetime
    if created.tzinfo is None:
        created = created.replace(tzinfo=dt.timezone.utc)
    age_seconds = (now - created).total_seconds()
    if age_seconds > TOKEN_TTL_SECONDS:
        await db.execute("DELETE FROM AuthToken WHERE Authtoken = $1", token)
        raise HTTPException(
            status_code=401,
            detail="Token expired, please reauthenticate",
        )

    await db.execute(
        "UPDATE AuthToken SET Created_DtTm = CURRENT_TIMESTAMP WHERE Authtoken = $1",
        token,
    )

    user_row = await db.fetchrow(
        "SELECT User_ID, Username, Email FROM Users WHERE User_ID = $1",
        token_row["user_id"],
    )
    if user_row is None:
        raise HTTPException(status_code=401, detail="User not found")
    return {"user": _row_to_user(user_row)}
