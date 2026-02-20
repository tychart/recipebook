from datetime import datetime
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter(
    prefix="/api/auth",
    tags=["authentication"],
)


class User(BaseModel):
    user_id: int | None = None
    username: str
    email: str
    password: str


class AuthToken(BaseModel):
    authtoken_id: int | None = None
    user_id: int
    token: str
    timestamp: datetime


class LoginRequest(BaseModel):
    username: str | None = None
    email: str | None = None
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


@router.post("/login")
async def login(body: LoginRequest):
    # TODO: validate username/email + password, create or refresh token, return token and user
    if not body.username and not body.email:
        raise HTTPException(status_code=400, detail="Provide username or email")
    return {
        "message": "Login successful!",
        "token": "",
        "user": {},
    }


@router.post("/register")
async def register(body: RegisterRequest):
    # TODO: create user in database, then login and return token
    userReturn = ""
    return {
        "message": "Registration successful!",
        "token": "",
        "user": userReturn.model_dump(exclude={"password"}),
    }


@router.post("/logout")
async def logout(authorization: str | None = Header(None)):
    # TODO: invalidate token if stored server-side and redirect to login page
    return {"message": "Logged out successfully!"}


@router.get("/me")
async def get_current_user(authorization: str | None = Header(None)):
    # TODO: validate token from Authorization header, return current user
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"user": {}}
