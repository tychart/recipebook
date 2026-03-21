# Running the tests that are available guide

This guide explains how to run the **server API tests** on your local machine (e.g. after cloning the repo or on another developer’s environment). The tests live under `server/tests/` and include both API tests (hitting the real FastAPI app and PostgreSQL) and unit tests for services and routers.

---

## How to run the tests

From the **repository root**:

```bash
# Run all tests under server/tests (API, services, routers, lifespan, etc.)
pytest server/tests -v

# Run only the API tests (auth, cookbooks, recipes, helloworld)
pytest server/tests/api_tests -v

# Run only service or router tests
pytest server/tests/services -v
pytest server/tests/routers -v
```

From the **server** directory:

```bash
cd server
pytest tests -v
pytest tests/api_tests -v
```

- `-v` is optional and prints each test name.
- To run a single test: `pytest server/tests/api_tests -v -k test_register`

---

## What the API tests cover

The API tests live in `server/tests/api_tests/` and cover:

- **Public:** `GET /api/helloworld`
- **Auth:** register, login (username and email), invalid password, `GET /me`, logout
- **Cookbooks:** list, create, get (with auth), 404
- **Recipes:** list, get, create (with auth), 404

They use unique usernames/emails per run, so you don’t need to reset the database between runs.

---

## Prerequisites

- **Python 3.11+** (or the version your team uses for the server)
- **PostgreSQL** running and reachable (see below)
- **pytest** and server dependencies (installed via `server/requirements.txt`)

You do **not** need S3/RustFS or Ollama for these tests; the app skips S3 setup if credentials are not set.

---

## 1. Get PostgreSQL running

The tests need a `recipebook` database with the project schema. Two common options:

### Option A: Docker Compose (recommended)

From the **repository root**:

1. Copy the example env and set DB credentials (if you don’t already have a `.env`):
   ```bash
   cp .env.example .env
   ```

2. Start only the database:
   ```bash
   docker compose up recipebook-db -d
   ```
   This starts PostgreSQL on **port 5432**, creates the `recipebook` database, and runs `db/CreateDB.sql` on first start.


## 2. Install Python dependencies

From the **repository root**:

```bash
pip install -r server/requirements.txt
```

Or use a virtual environment (recommended):

```bash
cd server
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
cd ..
```
This installs FastAPI, pytest, and the rest of the server stack.

## 4. Run the tests

See **How to run the tests** at the top of this guide. Summary: from the repository root run `pytest server/tests -v` for all tests, or `pytest server/tests/api_tests -v` for API tests only.

On success you’ll see the test list and “passed” for each. If the database isn’t running or the URL is wrong, you’ll get connection errors; if the schema is missing, you may see relation/table errors.

---

## 5. Troubleshooting

| Problem | What to check |
|--------|----------------|
| **Connection refused / could not connect** | PostgreSQL is not running. Start it (e.g. `docker compose up recipebook-db -d`) and ensure port 5432 is free. |
| **Authentication failed / password** | `DATABASE_URL` user and password must match the Postgres user (and `.env` if using Docker). |
| **Relation "users" does not exist** | Schema not applied. Run `db/CreateDB.sql` (and migrations if your app uses them on startup). |
| **ModuleNotFoundError: No module named 'fastapi'** | Run `pip install -r server/requirements.txt` from the same environment (and activate your venv if you use one). |
| **Tests pass locally but fail in CI** | CI must start Postgres and set `DATABASE_URL` the same way (see CI/docs for the pipeline). |
| There is also a problem if you re-run the tests without restarting the database, creating a new user returns a 400 error because of reused username/password|

---

## Summary

1. Start PostgreSQL (Docker: `docker compose up recipebook-db -d` from repo root).
2. Install deps: `pip install -r server/requirements.txt`.
3. Set `DATABASE_URL` only if you’re not using the default local DB.
4. Run: `pytest server/tests -v` (or `pytest server/tests/api_tests -v` for API tests only) from the repo root.

After that, anyone with the repo and a running Postgres can run the same API tests on their local environment.
