"""
PostgreSQL connection pool and FastAPI dependency helpers.
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import asyncpg

from core.config import get_settings
from run_migrations import run_migrations

_pool: asyncpg.Pool | None = None


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Database pool not initialized; app may not have started.")
    return _pool


async def init_pool() -> asyncpg.Pool:
    global _pool
    settings = get_settings()
    _pool = await asyncpg.create_pool(
        settings.database_url,
        min_size=1,
        max_size=10,
        command_timeout=60,
    )
    await run_migrations(_pool)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def get_connection() -> AsyncGenerator[asyncpg.Connection, None]:
    pool = get_pool()
    async with pool.acquire() as conn:
        yield conn


async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    async with get_connection() as conn:
        yield conn
