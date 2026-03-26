import asyncpg

from schemas.auth import AuthLoginRecord, AuthTokenRecord, AuthUserRecord


def _row_to_auth_user(row: asyncpg.Record) -> AuthUserRecord:
    data = dict(row)
    return AuthUserRecord(
        id=data["user_id"],
        username=data["username"],
        email=data["email"],
    )


def _row_to_login_record(row: asyncpg.Record) -> AuthLoginRecord:
    data = dict(row)
    return AuthLoginRecord(
        id=data["user_id"],
        username=data["username"],
        email=data["email"],
        password_hash=data["password"],
    )


def _row_to_token_record(row: asyncpg.Record) -> AuthTokenRecord:
    data = dict(row)
    return AuthTokenRecord(
        user_id=data["user_id"],
        created_at=data["created_dttm"],
    )


class AuthRepository:
    def __init__(self, conn: asyncpg.Connection):
        self.conn = conn

    async def fetch_user_for_login(self, username: str | None, email: str | None) -> AuthLoginRecord | None:
        row = await self.conn.fetchrow(
            """
            SELECT User_ID, Username, Email, Password
            FROM Users
            WHERE (Username = $1 OR Email = $2)
            """,
            username or email,
            email or username,
        )
        if row is None:
            return None
        return _row_to_login_record(row)

    async def create_user(self, username: str, password_hash: str, email: str) -> AuthUserRecord:
        row = await self.conn.fetchrow(
            """
            INSERT INTO Users (Username, Password, Email)
            VALUES ($1, $2, $3)
            RETURNING User_ID, Username, Email
            """,
            username,
            password_hash,
            email,
        )
        return _row_to_auth_user(row)

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

    async def get_token(self, token: str) -> AuthTokenRecord | None:
        row = await self.conn.fetchrow(
            "SELECT User_ID, Created_DtTm FROM AuthToken WHERE Authtoken = $1",
            token,
        )
        if row is None:
            return None
        return _row_to_token_record(row)

    async def touch_token(self, token: str) -> None:
        await self.conn.execute(
            "UPDATE AuthToken SET Created_DtTm = CURRENT_TIMESTAMP WHERE Authtoken = $1",
            token,
        )

    async def get_user_by_id(self, user_id: int) -> AuthUserRecord | None:
        row = await self.conn.fetchrow(
            "SELECT User_ID, Username, Email FROM Users WHERE User_ID = $1",
            user_id,
        )
        if row is None:
            return None
        return _row_to_auth_user(row)


    async def get_user_by_email(self, email: str) -> AuthUserRecord | None:
        row = await self.conn.fetchrow(
            """
            SELECT User_ID, Username, Email
            FROM Users
            WHERE LOWER(Email) = LOWER($1)
            """,
            email,
        )
        if row is None:
            return None
        return _row_to_auth_user(row)
