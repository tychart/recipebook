import asyncpg

from schemas.cookbook import Cookbook, CookbookRoleRecord, RoleEnum


def _text_to_categories(text: str | None) -> list[str]:
    if not text or not text.strip():
        return ["Main"]
    categories = [part.strip() for part in text.split(",") if part.strip()]
    return categories or ["Main"]


def _row_to_cookbook(row: asyncpg.Record) -> Cookbook:
    data = dict(row)
    return Cookbook(
        id=data["book_id"],
        name=data["book_name"],
        owner_id=data["owner_id"],
        categories=_text_to_categories(data.get("categories")),
        created_at=data.get("created_dttm"),
    )


class CookbookRepository:
    def __init__(self, conn: asyncpg.Connection):
        self.conn = conn

    async def create_cookbook(self, name: str, owner_id: int, categories: str) -> Cookbook:
        categories = categories.strip()
        row = await self.conn.fetchrow(
            """
            INSERT INTO Cookbook (Book_Name, Owner_ID, Categories)
            VALUES ($1, $2, $3)
            RETURNING Book_ID, Book_Name, Owner_ID, Created_DtTm, Categories
            """,
            name,
            owner_id,
            categories,
        )
        cookbook = _row_to_cookbook(row)
        row2 = await self.conn.fetchrow(
            """INSERT INTO cookbook_users (Book_id, user_id, role) 
            values ($1, $2, $3)""",
            cookbook.id,
            owner_id,
            'owner'
        )
        return cookbook

    async def get_cookbook(self, cookbook_id: int) -> Cookbook | None:
        row = await self.conn.fetchrow(
            """
            SELECT Book_ID, Book_Name, Owner_ID, Created_DtTm, Categories
            FROM Cookbook WHERE Book_ID = $1
            """,
            cookbook_id,
        )
        if row is None:
            return None
        return _row_to_cookbook(row)

    async def list_cookbooks_for_user(self, user_id: int) -> list[Cookbook]:
        rows = await self.conn.fetch(
            """
            SELECT * FROM (
                SELECT DISTINCT ON (c.Book_ID)
                    c.Book_ID, c.Book_Name, c.Owner_ID, c.Created_DtTm, c.Categories
                FROM Cookbook c
                WHERE c.Owner_ID = $1
                   OR c.Book_ID IN (SELECT Book_ID FROM Cookbook_Users WHERE User_ID = $1)
                ORDER BY c.Book_ID, c.Created_DtTm DESC
            ) sub
            ORDER BY Created_DtTm DESC
            """,
            user_id,
        )
        return [_row_to_cookbook(row) for row in rows]

    async def update_cookbook(self, cookbook_id: int, name: str, owner_id: int, categories: str) -> Cookbook | None:
        categories = categories.strip()
        row = await self.conn.fetchrow(
            """
            UPDATE Cookbook
            SET Book_Name = $1, Owner_ID = $2, Categories = $3
            WHERE Book_ID = $4
            RETURNING Book_ID, Book_Name, Owner_ID, Created_DtTm, Categories
            """,
            name,
            owner_id,
            categories,
            cookbook_id,
        )
        if row is None:
            return None
        return _row_to_cookbook(row)

    async def delete_cookbook_ingredients(self, cookbook_id: int) -> None:
        await self.conn.execute(
            """
            DELETE FROM Ingredients
            WHERE Recipe_ID IN (SELECT Recipe_ID FROM Recipe WHERE Book_ID = $1)
            """,
            cookbook_id,
        )

    async def delete_cookbook_instructions(self, cookbook_id: int) -> None:
        await self.conn.execute(
            """
            DELETE FROM Instructions
            WHERE Recipe_ID IN (SELECT Recipe_ID FROM Recipe WHERE Book_ID = $1)
            """,
            cookbook_id,
        )

    async def delete_cookbook_recipes(self, cookbook_id: int) -> None:
        await self.conn.execute("DELETE FROM Recipe WHERE Book_ID = $1", cookbook_id)

    async def delete_cookbook_users(self, cookbook_id: int) -> None:
        await self.conn.execute("DELETE FROM Cookbook_Users WHERE Book_ID = $1", cookbook_id)

    async def delete_cookbook(self, cookbook_id: int) -> int | None:
        row = await self.conn.fetchrow(
            "DELETE FROM Cookbook WHERE Book_ID = $1 RETURNING Book_ID",
            cookbook_id,
        )
        if row is None:
            return None
        return row["book_id"]

    async def upsert_shared_user(self, book_id: int, user_id: int, role: str) -> None:
        await self.conn.execute(
            """
            INSERT INTO Cookbook_Users (Book_ID, User_ID, Role)
            VALUES ($1, $2, $3::cookbook_role)
            ON CONFLICT (Book_ID, User_ID) DO UPDATE SET Role = EXCLUDED.Role
            """,
            book_id,
            user_id,
            role,
        )

    async def delete_shared_user(self, book_id: int, user_id: int) -> bool:
        row = await self.conn.fetchrow(
            """
            DELETE FROM Cookbook_Users
            WHERE Book_ID = $1 AND User_ID = $2
            RETURNING Book_ID
            """,
            book_id,
            user_id,
        )
        return row is not None

    async def get_shared_user_role(self, book_id: int, user_id: int) -> RoleEnum | None:
        row = await self.conn.fetchrow(
            """
            SELECT cu.Role::text AS role
            FROM Cookbook_Users cu
            WHERE cu.Book_ID = $1 AND cu.User_ID = $2
            """,
            book_id,
            user_id,
        )
        if row is None or row["role"] is None:
            return None
        return RoleEnum(row["role"])

    async def get_user_role(self, cookbook_id: int, user_id: int) -> CookbookRoleRecord | None:
        row = await self.conn.fetchrow(
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
        return CookbookRoleRecord(role=RoleEnum(row["role"]))

    async def list_cookbook_contributors_and_viewers(
        self, cookbook_id: int
    ) -> tuple[list[tuple[int, str, str]], list[tuple[int, str, str]]]:
        rows = await self.conn.fetch(
            """
            SELECT cu.User_ID AS user_id, u.Username AS username, u.Email AS email, cu.Role::text AS role
            FROM Cookbook_Users cu
            INNER JOIN Users u ON u.User_ID = cu.User_ID
            WHERE cu.Book_ID = $1 AND cu.Role IN ('contributor', 'viewer')
            ORDER BY LOWER(u.Username)
            """,
            cookbook_id,
        )
        contributors: list[tuple[int, str, str]] = []
        viewers: list[tuple[int, str, str]] = []
        for row in rows:
            pair = (row["user_id"], row["username"], row["email"])
            if row["role"] == RoleEnum.contributor.value:
                contributors.append(pair)
            else:
                viewers.append(pair)
        return contributors, viewers
