from fastapi import Depends, Request

from core.config import get_settings
from db.connection import get_db
from repositories.auth_repo import AuthRepository
from repositories.cookbook_repo import CookbookRepository
from repositories.recipe_repo import RecipeRepository
from services.auth_service import AuthService
from services.cookbook_service import CookbookService
from services.generate_service import GenerateService
from services.job_service import JobManager, JobService
from services.recipe_service import RecipeService
from services.storage_service import StorageService, get_storage_service


async def get_auth_service(db=Depends(get_db)) -> AuthService:
    return AuthService(AuthRepository(db))


async def get_cookbook_service(db=Depends(get_db)) -> CookbookService:
    return CookbookService(CookbookRepository(db))


async def get_recipe_service(db=Depends(get_db)) -> RecipeService:
    return RecipeService(
        db,
        RecipeRepository(db),
        CookbookRepository(db),
    )


def get_job_manager(request: Request) -> JobManager:
    manager = getattr(request.app.state, "job_manager", None)
    if manager is None:
        raise RuntimeError("Job manager has not been initialized")
    return manager


def get_job_service(request: Request) -> JobService:
    return JobService(get_job_manager(request))


def get_generation_provider(request: Request):
    provider = getattr(request.app.state, "generation_provider", None)
    if provider is None:
        raise RuntimeError("Generation provider has not been initialized")
    return provider


async def get_generate_service(
    request: Request,
    recipe_service: RecipeService = Depends(get_recipe_service),
) -> GenerateService:
    return GenerateService(
        job_service=JobService(get_job_manager(request)),
        provider=get_generation_provider(request),
        settings=get_settings(),
        recipe_service=recipe_service,
    )


def get_storage_service_dep() -> StorageService:
    return get_storage_service()
