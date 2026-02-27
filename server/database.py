"""
PostgreSQL connection pool and dependency for FastAPI.
Read DATABASE_URL from environment (set in docker-compose or .env).
"""
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import asyncpg

# Default for local dev when DB runs in Docker (recipebook-db on host port 5432)
_DEFAULT_URL = "postgresql://RecipeAdmin:R3c1peB00k@localhost:5432/recipebook"
DATABASE_URL = os.getenv("DATABASE_URL", _DEFAULT_URL)

# Global pool, set in lifespan
_pool: asyncpg.Pool | None = None


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Database pool not initialized; app may not have started.")
    return _pool


async def init_pool() -> asyncpg.Pool:
    global _pool
    _pool = await asyncpg.create_pool(
        DATABASE_URL,
        min_size=1,
        max_size=10,
        command_timeout=60,
    )
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def get_connection() -> AsyncGenerator[asyncpg.Connection, None]:
    """Yield a single connection from the pool. Use in endpoints via get_db()."""
    pool = get_pool()
    async with pool.acquire() as conn:
        yield conn


async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    """FastAPI dependency: yield a DB connection for the request."""
    async with get_connection() as conn:
        yield conn
