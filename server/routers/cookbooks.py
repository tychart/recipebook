from fastapi import APIRouter, UploadFile, Form, File
from pydantic import BaseModel
from typing import List

router = APIRouter(
    prefix="/api/cookbooks",
    tags=["cookbooks"],
)

class Cookbook(BaseModel):
    book_id: int | None = None
    book_name: str
    owner_id: int
    categories: List[str]

@router.post("/create")
async def create_cookbook(
    cookbookdata: str = Form(...)
):
    cookbook_data = Cookbook.model_validate_json(cookbookdata)
    # TODO: add in server call to send data to server
    return {
        "message": "Cookbook uploaded successfully!",
        "cookbook": cookbook_data.model_dump()
    }
