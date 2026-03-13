from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List
from enum import Enum
import datetime as dt
import asyncpg

from database import get_db
from routers.auth import CurrentUser, get_current_user_dep

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
    created_at: dt.datetime | None = None  # optional on create; set by DB


class ShareCookbookRequest(BaseModel):
    book_id: int
    user_id: int
    role: RoleEnum = RoleEnum.viewer  # contributor or viewer (not owner)


def _row_to_cookbook(row: asyncpg.Record) -> dict:
    """Map DB row (Cookbook table) to API shape."""
    categories_str = row["categories"] or "Main"
    categories = [c.strip() for c in categories_str.split(",") if c.strip()]
    return {
        "id": row["book_id"],
        "name": row["book_name"],
        "owner_id": row["owner_id"],
        "categories": categories,
        "created_at": row["created_dttm"].isoformat() if row.get("created_dttm") else None,
    }


async def get_cookbook_role(
    db: asyncpg.Connection,
    cookbook_id: int,
    user_id: int,
) -> RoleEnum | None:
    """
    Determine the user's role for a given cookbook, considering both ownership and Cookbook_Users.
    """
    row = await db.fetchrow(
        """
        SELECT
          CASE
            WHEN c.Owner_ID = $2 THEN 'owner'
            ELSE cu.Role
          END AS role
        FROM Cookbook c
        LEFT JOIN Cookbook_Users cu
          ON cu.Book_ID = c.Book_ID AND cu.User_ID = $2
        WHERE c.Book_ID = $1
        """,
        cookbook_id,
        user_id,
    )
    if row is None or row["role"] is None:
        return None
    return RoleEnum(row["role"])


async def require_cookbook_role(
    db: asyncpg.Connection,
    cookbook_id: int,
    user_id: int,
    allowed_roles: list[RoleEnum],
) -> None:
    role = await get_cookbook_role(db, cookbook_id, user_id)
    if role is None or role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not allowed for this cookbook")


@router.post("/create")
async def create_cookbook(
    cookbook: Cookbook,
    db: asyncpg.Connection = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    categories_str = ",".join(cookbook.categories) if cookbook.categories else "Main"
    row = await db.fetchrow(
        """
        INSERT INTO Cookbook (Book_Name, Owner_ID, Categories)
        VALUES ($1, $2, $3)
        RETURNING Book_ID, Book_Name, Owner_ID, Created_DtTm, Categories
        """,
        cookbook.name,
        current_user.id,
        categories_str,
    )
    created = _row_to_cookbook(row)
    return {
        "message": "Cookbook created successfully!",
        "cookbook": created,
    }


@router.get("/get/{cookbook_id}")
async def get_cookbook(
    cookbook_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    await require_cookbook_role(
        db,
        cookbook_id,
        current_user.id,
        [RoleEnum.owner, RoleEnum.contributor, RoleEnum.viewer],
    )
    row = await db.fetchrow(
        """
        SELECT Book_ID, Book_Name, Owner_ID, Created_DtTm, Categories
        FROM Cookbook WHERE Book_ID = $1
        """,
        cookbook_id,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Cookbook not found")
    return _row_to_cookbook(row)


@router.get("/list")
async def list_cookbooks(
    db: asyncpg.Connection = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    rows = await db.fetch(
        """
        SELECT * FROM (
            SELECT DISTINCT ON (c.Book_ID) c.Book_ID, c.Book_Name, c.Owner_ID, c.Created_DtTm, c.Categories
            FROM Cookbook c
            WHERE c.Owner_ID = $1
               OR c.Book_ID IN (SELECT Book_ID FROM Cookbook_Users WHERE User_ID = $1)
            ORDER BY c.Book_ID, c.Created_DtTm DESC
        ) sub
        ORDER BY Created_DtTm DESC
        """,
        current_user.id,
    )
    return [_row_to_cookbook(r) for r in rows]


@router.post("/edit")
async def edit_cookbook(
    cookbook: Cookbook,
    db: asyncpg.Connection = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    if cookbook.id is None:
        raise HTTPException(status_code=400, detail="Cookbook id is required for edit")
    await require_cookbook_role(
        db,
        cookbook.id,
        current_user.id,
        [RoleEnum.owner],
    )
    categories_str = ",".join(cookbook.categories) if cookbook.categories else "Main"
    row = await db.fetchrow(
        """
        UPDATE Cookbook
        SET Book_Name = $1, Owner_ID = $2, Categories = $3
        WHERE Book_ID = $4
        RETURNING Book_ID, Book_Name, Owner_ID, Created_DtTm, Categories
        """,
        cookbook.name,
        cookbook.owner_id,
        categories_str,
        cookbook.id,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Cookbook not found")
    return {
        "message": "Cookbook edited successfully!",
        "cookbook": _row_to_cookbook(row),
    }


@router.post("/delete/{cookbook_id}")
async def delete_cookbook(
    cookbook_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    await require_cookbook_role(
        db,
        cookbook_id,
        current_user.id,
        [RoleEnum.owner],
    )
    # Delete in dependency order: ingredients -> recipes -> cookbook_users -> cookbook
    await db.execute(
        """
        DELETE FROM Ingredients
        WHERE Recipe_ID IN (SELECT Recipe_ID FROM Recipe WHERE Book_ID = $1)
        """,
        cookbook_id,
    )
    await db.execute("DELETE FROM Recipe WHERE Book_ID = $1", cookbook_id)
    await db.execute("DELETE FROM Cookbook_Users WHERE Book_ID = $1", cookbook_id)
    row = await db.fetchrow(
        "DELETE FROM Cookbook WHERE Book_ID = $1 RETURNING Book_ID",
        cookbook_id,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Cookbook not found")
    return {"message": "Cookbook deleted successfully!"}


@router.post("/share")
async def share_cookbook(
    body: ShareCookbookRequest,
    db: asyncpg.Connection = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user_dep),
):
    await require_cookbook_role(
        db,
        body.book_id,
        current_user.id,
        [RoleEnum.owner],
    )
    if body.role == RoleEnum.owner:
        raise HTTPException(status_code=400, detail="Cannot share as owner; use transfer instead.")
    await db.execute(
        """
        INSERT INTO Cookbook_Users (Book_ID, User_ID, Role)
        VALUES ($1, $2, $3::cookbook_role)
        ON CONFLICT (Book_ID, User_ID) DO UPDATE SET Role = EXCLUDED.Role
        """,
        body.book_id,
        body.user_id,
        body.role.value,
    )
    return {
        "message": "Cookbook shared successfully!",
        "book_id": body.book_id,
        "user_id": body.user_id,
        "role": body.role.value,
    }
