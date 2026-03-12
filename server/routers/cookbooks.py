from fastapi import APIRouter, Depends, Query

from dependencies.auth import get_current_user_dep
from dependencies.services import get_cookbook_service
from schemas.auth import CurrentUser
from schemas.cookbook import Cookbook, RoleEnum, ShareCookbookRequest
from services.cookbook_service import CookbookService

router = APIRouter(
    prefix="/api/cookbook",
    tags=["cookbooks"],
)

@router.post("/create")
async def create_cookbook(
    cookbook: Cookbook,
    cookbook_service: CookbookService = Depends(get_cookbook_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await cookbook_service.create_cookbook(cookbook, current_user)


@router.get("/get/{cookbook_id}")
async def get_cookbook(
    cookbook_id: int,
    cookbook_service: CookbookService = Depends(get_cookbook_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await cookbook_service.get_cookbook(cookbook_id, current_user)


@router.get("/list")
async def list_cookbooks(
    owner_id: int | None = Query(default=None),
    cookbook_service: CookbookService = Depends(get_cookbook_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    del owner_id
    return await cookbook_service.list_cookbooks(current_user)


@router.post("/edit")
async def edit_cookbook(
    cookbook: Cookbook,
    cookbook_service: CookbookService = Depends(get_cookbook_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await cookbook_service.edit_cookbook(cookbook, current_user)


@router.post("/delete/{cookbook_id}")
async def delete_cookbook(
    cookbook_id: int,
    cookbook_service: CookbookService = Depends(get_cookbook_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await cookbook_service.delete_cookbook(cookbook_id, current_user)


@router.post("/share")
async def share_cookbook(
    body: ShareCookbookRequest,
    cookbook_service: CookbookService = Depends(get_cookbook_service),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    return await cookbook_service.share_cookbook(body, current_user)
