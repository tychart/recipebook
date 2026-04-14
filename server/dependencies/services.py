from fastapi import Depends, Request

from core.config import get_settings
from db.connection import get_db
from inference.recipe_import import RecipeImportClient
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


async def get_cookbook_service(
    db=Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> CookbookService:
    return CookbookService(
        CookbookRepository(db),
        auth_service,
        RecipeRepository(db),
    )

async def get_recipe_service(
    db=Depends(get_db),
    cookbook_service: CookbookService = Depends(get_cookbook_service),
) -> RecipeService:
    return RecipeService(
        db,
        RecipeRepository(db),
        cookbook_service,
        get_storage_service(),
    )


def get_job_manager(request: Request) -> JobManager:
    manager = getattr(request.app.state, "job_manager", None)
    if manager is None:
        raise RuntimeError("Job manager has not been initialized")
    return manager


def get_job_service(request: Request) -> JobService:
    return JobService(get_job_manager(request))


def get_recipe_import_client(request: Request) -> RecipeImportClient:
    recipe_import_client = getattr(request.app.state, "recipe_import_client", None)
    if recipe_import_client is None:
        raise RuntimeError("Recipe import client has not been initialized")
    return recipe_import_client


async def get_generate_service(
    request: Request,
    recipe_service: RecipeService = Depends(get_recipe_service),
) -> GenerateService:
    return GenerateService(
        job_service=JobService(get_job_manager(request)),
        recipe_import_client=get_recipe_import_client(request),
        settings=get_settings(),
        recipe_service=recipe_service,
    )


def get_storage_service_dep() -> StorageService:
    return get_storage_service()
