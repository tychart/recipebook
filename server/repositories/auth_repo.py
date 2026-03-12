import asyncpg


class AuthRepository:
    def __init__(self, conn: asyncpg.Connection):
        self.conn = conn

    async def fetch_user_for_login(self, username: str | None, email: str | None):
        return await self.conn.fetchrow(
            """
            SELECT User_ID, Username, Email, Password
            FROM Users
            WHERE (Username = $1 OR Email = $2)
            """,
            username or email,
            email or username,
        )

    async def create_user(self, username: str, password: str, email: str):
        return await self.conn.fetchrow(
            """
            INSERT INTO Users (Username, Password, Email)
            VALUES ($1, $2, $3)
            RETURNING User_ID, Username, Email
            """,
            username,
            password,
            email,
        )

    async def insert_token(self, token: str, user_id: int) -> None:
        await self.conn.execute(
            "INSERT INTO AuthToken (Authtoken, User_ID) VALUES ($1, $2)",
            token,
            user_id,
        )

    async def delete_token(self, token: str) -> None:
        await self.conn.execute(
            "DELETE FROM AuthToken WHERE Authtoken = $1",
            token,
        )

    async def get_token(self, token: str):
        return await self.conn.fetchrow(
            "SELECT User_ID, Created_DtTm FROM AuthToken WHERE Authtoken = $1",
            token,
        )

    async def touch_token(self, token: str) -> None:
        await self.conn.execute(
            "UPDATE AuthToken SET Created_DtTm = CURRENT_TIMESTAMP WHERE Authtoken = $1",
            token,
        )

    async def get_user_by_id(self, user_id: int):
        return await self.conn.fetchrow(
            "SELECT User_ID, Username, Email FROM Users WHERE User_ID = $1",
            user_id,
        )
