from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from dependencies.auth import bearer_scheme, get_current_user_dep
from dependencies.services import get_auth_service
from schemas.auth import CurrentUser, LoginRequest, RegisterRequest, User
from services.auth_service import AuthService

router = APIRouter(
    prefix="/api/auth",
    tags=["authentication"],
)

logout_bearer = HTTPBearer(auto_error=False)


@router.post("/register")
async def register(
    body: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    return await auth_service.register(body)


@router.post("/login")
async def login(
    body: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    return await auth_service.login(body)


@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials | None = Depends(logout_bearer),
    auth_service: AuthService = Depends(get_auth_service),
):
    token = credentials.credentials.strip() if credentials else None
    return await auth_service.logout(token)


@router.get("/me")
async def get_current_user(
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return {"user": current_user}
