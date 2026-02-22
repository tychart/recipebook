from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List
from enum import Enum
import datetime as dt

router = APIRouter(
    prefix="/api/cookbook",
    tags=["cookbooks"],
)


class RoleEnum(str, Enum):
    owner = "owner"
    contributor = "contributor"
    viewer = "viewer"


class Cookbook(BaseModel):
    id: int | None = None
    name: str
    owner_id: int
    categories: List[str]
    created_at: dt.datetime


class ShareCookbookRequest(BaseModel):
    book_id: int
    user_id: int
    role: RoleEnum = RoleEnum.viewer  # contributor or viewer (not owner)


@router.post("/create")
async def create_cookbook(cookbook: Cookbook):
    # TODO: insert cookbook into database (omit book_id for insert)
    return {
        "message": "Cookbook created successfully!",
        "cookbook": cookbook.model_dump(),
    }


@router.get("/get/{cookbook_id}")
async def get_cookbook(cookbook_id: int):
    # TODO: get cookbook from database using book_id
    cookbook_data = ""
    return cookbook_data


@router.get("/list")
async def list_cookbooks(owner_id: int | None = Query(None)):
    # TODO: get cookbooks from database, optionally filter by owner_id
    return []


@router.post("/edit")
async def edit_cookbook(cookbook: Cookbook):
    # TODO: update cookbook in database (require book_id)
    return {
        "message": "Cookbook edited successfully!",
        "cookbook": cookbook.model_dump(),
    }


@router.post("/delete/{cookbook_id}")
async def delete_cookbook(cookbook_id: int):
    # TODO: delete cookbook from database with book_id
    return {
        "message": "Cookbook deleted successfully!",
    }


@router.post("/share")
async def share_cookbook(body: ShareCookbookRequest):
    # TODO: grant user_id access to book_id with role (e.g. insert into cookbook_members or similar)
    if body.role == RoleEnum.owner:
        raise HTTPException(status_code=400, detail="Cannot share as owner; use transfer instead.")
    return {
        "message": "Cookbook shared successfully!",
        "book_id": body.book_id,
        "user_id": body.user_id,
        "role": body.role.value,
    }
