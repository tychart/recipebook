# Database migrations

Migrations here are applied **automatically** when the backend starts (see `server/run_migrations.py`). The same SQL is kept in the server so the app works in Docker without mounting this folder.

To run a migration manually (e.g. before starting the server):

```bash
# From project root, with docker compose running. Use the Postgres user from your .env (e.g. RecipeAdmin).
source .env
docker compose exec -T recipebook-db psql -U "${PG_USER}" -d recipebook < db/migrations/001_add_instructions_if_missing.sql
# If PG_USER is empty in your shell, use the username from .env literally, e.g. -U RecipeAdmin
```

All migrations should be idempotent (safe to run multiple times; use `CREATE TABLE IF NOT EXISTS`, etc.).
