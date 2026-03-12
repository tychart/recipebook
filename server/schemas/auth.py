import datetime as dt

from pydantic import BaseModel


TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60


class User(BaseModel):
    id: int | None = None
    username: str
    email: str
    password: str | None = None


class LoginRequest(BaseModel):
    username: str | None = None
    email: str | None = None
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class CurrentUser(BaseModel):
    id: int
    username: str
    email: str


class AuthTokenRecord(BaseModel):
    user_id: int
    created_at: dt.datetime
