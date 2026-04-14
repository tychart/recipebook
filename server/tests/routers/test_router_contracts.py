import asyncio
import json

from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from dependencies.auth import get_current_user_dep
from dependencies.services import get_generate_service
from dependencies.services import get_recipe_service
from routers import auth as auth_router
from routers import generate as generate_router
from routers import recipes as recipe_router
from schemas.auth import CurrentUser


class FakeRecipeService:
    async def create_recipe(self, cookbook_id, recipe, current_user, image=None):
        return {
            "message": "Recipe created successfully!",
            "recipe": {
                "id": 12,
                "name": recipe.name,
                "ingredients": [ingredient.model_dump() for ingredient in recipe.ingredients],
                "instructions": [instruction.model_dump() for instruction in recipe.instructions],
                "notes": recipe.notes,
                "description": recipe.description,
                "servings": recipe.servings,
                "creator_id": current_user.id,
                "category": recipe.category,
                "image_url": recipe.image_url,
                "tags": recipe.tags,
                "cookbook_id": cookbook_id,
                "modified_at": None,
            },
        }

    async def edit_recipe(self, recipe, current_user, image=None):
        return {
            "message": "Recipe edited successfully!",
            "recipe": {
                "id": recipe.id,
                "name": recipe.name,
                "ingredients": [ingredient.model_dump() for ingredient in recipe.ingredients],
                "instructions": [instruction.model_dump() for instruction in recipe.instructions],
                "notes": recipe.notes,
                "description": recipe.description,
                "servings": recipe.servings,
                "creator_id": current_user.id,
                "category": recipe.category,
                "image_url": "http://public.example/recipes/3/new.png?signed=1" if image else recipe.image_url,
                "tags": recipe.tags,
                "cookbook_id": recipe.cookbook_id,
                "modified_at": None,
            },
        }


class FakeGenerateService:
    async def enqueue_text_job(self, body, current_user):
        return {
            "job_id": "job-text-1",
            "status": "queued",
            "source": "text",
            "created_at": "2026-01-01T00:00:00Z",
            "started_at": None,
            "completed_at": None,
            "error": None,
        }

    async def enqueue_image_upload(self, image, current_user, context_text=None):
        return {
            "job_id": "job-image-1",
            "status": "queued",
            "source": "image",
            "created_at": "2026-01-01T00:00:00Z",
            "started_at": None,
            "completed_at": None,
            "error": None,
        }

    async def process_search_query(self, body, current_user):
        return [
            {
                "recipe_id": 12,
                "recipe_name": "Brownies",
                "cookbook_id": 3,
                "cookbook_name": "Dessert Vault",
                "image_url": "http://public.example/recipes/3/brownies.png?signed=1",
                "category": "Dessert",
                "tags": ["sweet"],
                "score": 0.98,
            }
        ]

    async def reembed_user_recipes(self, current_user):
        return {
            "processed_count": 4,
            "updated_count": 4,
        }

    async def list_jobs(self, current_user):
        return [
            {
                "job_id": "job-text-1",
                "status": "queued",
                "source": "text",
                "created_at": "2026-01-01T00:00:00Z",
                "started_at": None,
                "completed_at": None,
                "error": None,
            }
        ]

    async def get_job(self, job_id, current_user):
        return {
            "job_id": job_id,
            "status": "succeeded",
            "source": "text",
            "created_at": "2026-01-01T00:00:00Z",
            "started_at": "2026-01-01T00:00:01Z",
            "completed_at": "2026-01-01T00:00:02Z",
            "error": None,
            "result": {
                "draft": {
                    "name": "Brownies",
                    "description": "",
                    "servings": 1,
                    "instructions": ["Mix"],
                    "notes": "",
                    "ingredients": [{"name": "sugar", "amount": 1, "unit": "cup"}],
                    "category": "Main",
                    "tags": [],
                },
                "raw_text": "Brownies\n1 cup sugar\nMix",
                "metadata": {"source": "text"},
            },
            "logs": ["job-worker-1: started attempt 1", "job-worker-1: finished"],
        }

    async def retry_job(self, job_id, current_user):
        return {
            "job_id": job_id,
            "status": "queued",
            "source": "text",
            "created_at": "2026-01-01T00:00:00Z",
            "started_at": None,
            "completed_at": None,
            "error": None,
        }


def test_auth_me_route_returns_legacy_shape():
    async def run():
        app = FastAPI()
        app.include_router(auth_router.router)

        async def override_current_user():
            return CurrentUser(
                id=1,
                username="alice",
                email="alice@example.com",
            )

        app.dependency_overrides[get_current_user_dep] = override_current_user

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as client:
            response = await client.get("/api/auth/me")

        assert response.status_code == 200
        assert response.json() == {
            "user": {
                "id": 1,
                "username": "alice",
                "email": "alice@example.com",
            }
        }

    asyncio.run(run())


def test_recipe_create_route_keeps_existing_path_and_response_shape():
    async def run():
        app = FastAPI()
        app.include_router(recipe_router.router)

        async def override_current_user():
            return CurrentUser(
                id=5,
                username="chef",
                email="chef@example.com",
            )

        async def override_recipe_service():
            return FakeRecipeService()

        app.dependency_overrides[get_current_user_dep] = override_current_user
        app.dependency_overrides[get_recipe_service] = override_recipe_service

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as client:
            response = await client.post(
                "/api/recipe/create/3",
                files={
                    "recipe": (
                        None,
                        json.dumps(
                            {
                                "name": "Brownies",
                                "ingredients": [{"amount": 1, "unit": "cup", "name": "sugar"}],
                                "instructions": [{"instruction_number": 1, "instruction_text": "Mix"}],
                                "notes": None,
                                "description": "Rich and fudgy",
                                "servings": 8,
                                "creator_id": 999,
                                "category": "Dessert",
                                "image_url": None,
                                "tags": ["sweet"],
                                "cookbook_id": 3,
                                "modified_at": None,
                            }
                        ),
                    ),
                    "image": ("brownies.png", b"png-bytes", "image/png"),
                },
            )

        body = response.json()

        assert response.status_code == 200
        assert body["message"] == "Recipe created successfully!"
        assert body["recipe"]["id"] == 12
        assert body["recipe"]["creator_id"] == 5

    asyncio.run(run())


def test_recipe_edit_route_keeps_existing_path_and_response_shape():
    async def run():
        app = FastAPI()
        app.include_router(recipe_router.router)

        async def override_current_user():
            return CurrentUser(
                id=5,
                username="chef",
                email="chef@example.com",
            )

        async def override_recipe_service():
            return FakeRecipeService()

        app.dependency_overrides[get_current_user_dep] = override_current_user
        app.dependency_overrides[get_recipe_service] = override_recipe_service

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as client:
            response = await client.post(
                "/api/recipe/edit",
                files={
                    "recipe": (
                        None,
                        json.dumps(
                            {
                                "id": 12,
                                "name": "Brownies",
                                "ingredients": [{"amount": 1, "unit": "cup", "name": "sugar"}],
                                "instructions": [{"instruction_number": 1, "instruction_text": "Mix"}],
                                "notes": None,
                                "description": "Rich and fudgy",
                                "servings": 8,
                                "creator_id": 999,
                                "category": "Dessert",
                                "image_url": None,
                                "tags": ["sweet"],
                                "cookbook_id": 3,
                                "modified_at": None,
                            }
                        ),
                    ),
                    "image": ("brownies.png", b"png-bytes", "image/png"),
                },
            )

        body = response.json()

        assert response.status_code == 200
        assert body["message"] == "Recipe edited successfully!"
        assert body["recipe"]["id"] == 12
        assert body["recipe"]["creator_id"] == 5
        assert "signed=1" in body["recipe"]["image_url"]

    asyncio.run(run())


def test_generate_image_route_queues_job():
    async def run():
        app = FastAPI()
        app.include_router(generate_router.router)

        async def override_generate_service():
            return FakeGenerateService()

        async def override_current_user():
            return CurrentUser(
                id=5,
                username="chef",
                email="chef@example.com",
            )

        app.dependency_overrides[get_generate_service] = override_generate_service
        app.dependency_overrides[get_current_user_dep] = override_current_user

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as client:
            response = await client.post(
                "/api/generate/image",
                files={
                    "image": ("brownies.png", b"png-bytes", "image/png"),
                    "context_text": (None, "Use the title Cosmic Brownies"),
                },
            )

        assert response.status_code == 202
        assert response.json() == {
            "job_id": "job-image-1",
            "status": "queued",
            "source": "image",
            "created_at": "2026-01-01T00:00:00Z",
            "started_at": None,
            "completed_at": None,
            "error": None,
        }

    asyncio.run(run())


def test_generate_text_route_queues_job():
    async def run():
        app = FastAPI()
        app.include_router(generate_router.router)

        async def override_generate_service():
            return FakeGenerateService()

        async def override_current_user():
            return CurrentUser(
                id=5,
                username="chef",
                email="chef@example.com",
            )

        app.dependency_overrides[get_generate_service] = override_generate_service
        app.dependency_overrides[get_current_user_dep] = override_current_user

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as client:
            response = await client.post(
                "/api/generate/text",
                json={"text": "Brownies\n1 cup sugar\nMix"},
            )

        assert response.status_code == 202
        assert response.json() == {
            "job_id": "job-text-1",
            "status": "queued",
            "source": "text",
            "created_at": "2026-01-01T00:00:00Z",
            "started_at": None,
            "completed_at": None,
            "error": None,
        }

    asyncio.run(run())


def test_generate_text_route_requires_auth():
    async def run():
        app = FastAPI()
        app.include_router(generate_router.router)

        async def override_generate_service():
            return FakeGenerateService()

        app.dependency_overrides[get_generate_service] = override_generate_service

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as client:
            response = await client.post(
                "/api/generate/text",
                json={"text": "Brownies\n1 cup sugar\nMix"},
            )

        assert response.status_code == 401

    asyncio.run(run())


def test_generate_jobs_detail_route_returns_full_result():
    async def run():
        app = FastAPI()
        app.include_router(generate_router.router)

        async def override_generate_service():
            return FakeGenerateService()

        async def override_current_user():
            return CurrentUser(
                id=5,
                username="chef",
                email="chef@example.com",
            )

        app.dependency_overrides[get_generate_service] = override_generate_service
        app.dependency_overrides[get_current_user_dep] = override_current_user

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as client:
            response = await client.get("/api/generate/jobs/job-text-1")

        assert response.status_code == 200
        assert response.json()["result"]["draft"]["name"] == "Brownies"
        assert response.json()["result"]["raw_text"] == "Brownies\n1 cup sugar\nMix"

    asyncio.run(run())


def test_generate_jobs_retry_route_requires_auth_and_requeues():
    async def run():
        app = FastAPI()
        app.include_router(generate_router.router)

        async def override_generate_service():
            return FakeGenerateService()

        async def override_current_user():
            return CurrentUser(
                id=5,
                username="chef",
                email="chef@example.com",
            )

        app.dependency_overrides[get_generate_service] = override_generate_service
        app.dependency_overrides[get_current_user_dep] = override_current_user

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as client:
            response = await client.post("/api/generate/jobs/job-text-1/retry")

        assert response.status_code == 202
        assert response.json()["status"] == "queued"

    asyncio.run(run())


def test_generate_search_route_returns_summary_results():
    async def run():
        app = FastAPI()
        app.include_router(generate_router.router)

        async def override_generate_service():
            return FakeGenerateService()

        async def override_current_user():
            return CurrentUser(
                id=5,
                username="chef",
                email="chef@example.com",
            )

        app.dependency_overrides[get_generate_service] = override_generate_service
        app.dependency_overrides[get_current_user_dep] = override_current_user

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as client:
            response = await client.post(
                "/api/generate/search",
                json={"query": "brownies", "limit": 5},
            )

        assert response.status_code == 200
        assert response.json() == [
            {
                "recipe_id": 12,
                "recipe_name": "Brownies",
                "cookbook_id": 3,
                "cookbook_name": "Dessert Vault",
                "image_url": "http://public.example/recipes/3/brownies.png?signed=1",
                "category": "Dessert",
                "tags": ["sweet"],
                "score": 0.98,
            }
        ]

    asyncio.run(run())


def test_generate_search_route_requires_auth():
    async def run():
        app = FastAPI()
        app.include_router(generate_router.router)

        async def override_generate_service():
            return FakeGenerateService()

        app.dependency_overrides[get_generate_service] = override_generate_service

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as client:
            response = await client.post(
                "/api/generate/search",
                json={"query": "brownies", "limit": 5},
            )

        assert response.status_code == 401

    asyncio.run(run())


def test_generate_reembed_route_requires_auth_and_returns_counts():
    async def run():
        app = FastAPI()
        app.include_router(generate_router.router)

        async def override_generate_service():
            return FakeGenerateService()

        async def override_current_user():
            return CurrentUser(
                id=5,
                username="chef",
                email="chef@example.com",
            )

        app.dependency_overrides[get_generate_service] = override_generate_service
        app.dependency_overrides[get_current_user_dep] = override_current_user

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as client:
            response = await client.post("/api/generate/reembed")

        assert response.status_code == 200
        assert response.json() == {
            "processed_count": 4,
            "updated_count": 4,
        }

    asyncio.run(run())


def test_generate_reembed_route_rejects_unauthenticated_requests():
    async def run():
        app = FastAPI()
        app.include_router(generate_router.router)

        async def override_generate_service():
            return FakeGenerateService()

        app.dependency_overrides[get_generate_service] = override_generate_service

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as client:
            response = await client.post("/api/generate/reembed")

        assert response.status_code == 401

    asyncio.run(run())
