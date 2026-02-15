from fastapi import APIRouter, UploadFile, Form, File
from pydantic import BaseModel
from typing import List
from enum import Enum

router = APIRouter(
    prefix="/api/cookbooks",
    tags=["cookbooks"],
)

class RoleEnum(str, Enum):
    owner = "owner"
    contributor = "contributor"
    viewer = "viewer"

class Cookbook(BaseModel):
    book_id: int | None = None
    book_name: str
    owner_id: int
    categories: List[str]


