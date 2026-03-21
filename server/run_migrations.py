"""
Run database migrations on startup. Idempotent (safe to run multiple times).
Keeps existing DBs in sync when schema changes are added to the repo.
"""
import logging

import asyncpg

logger = logging.getLogger(__name__)

# Migrations: each is run in order. Use "IF NOT EXISTS" / idempotent SQL where possible.
MIGRATIONS = [
    # 001: Instructions table (DBs created before it was in CreateDB.sql)
    """
    CREATE TABLE IF NOT EXISTS instructions (
      instruction_id SERIAL PRIMARY KEY,
      recipe_id INTEGER NOT NULL REFERENCES recipe(recipe_id),
      instruction_number INTEGER NOT NULL,
      instruction_text TEXT NOT NULL
    );
    """,
]


async def run_migrations(pool: asyncpg.Pool) -> None:
    """Run all migrations using the given connection pool."""
    async with pool.acquire() as conn:
        for i, sql in enumerate(MIGRATIONS, start=1):
            try:
                await conn.execute(sql.strip())
                logger.info("Migration %s applied.", i)
            except Exception as e:
                logger.warning("Migration %s: %s (may already be applied)", i, e)
