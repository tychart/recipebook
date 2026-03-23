import datetime as dt
from enum import Enum

from pydantic import BaseModel


class RoleEnum(str, Enum):
    owner = "owner"
    contributor = "contributor"
    viewer = "viewer"


class Cookbook(BaseModel):
    id: int | None = None
    name: str
    owner_id: int
    categories: list[str]
    created_at: dt.datetime | None = None


class CookbookRoleRecord(BaseModel):
    role: RoleEnum


class CookbookMember(BaseModel):
    user_id: int
    username: str
    email: str


class ShareCookbookRequest(BaseModel):
    book_id: int
    user_id: int
    role: RoleEnum = RoleEnum.viewer
