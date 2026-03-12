from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from dependencies.services import get_auth_service
from schemas.auth import CurrentUser
from services.auth_service import AuthService


bearer_scheme = HTTPBearer()


async def get_current_user_dep(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> CurrentUser:
    token = credentials.credentials.strip()
    return await auth_service.authenticate_token(token)
