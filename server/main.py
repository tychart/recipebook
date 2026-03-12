from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from db.connection import close_pool, init_pool
from routers import recipes, auth, cookbooks, generate, storage
from services.generate_service import GenerateService, create_llm_provider
from services.job_service import JobManager, JobService
from services.storage_service import get_storage_service
from workers.job_worker import start_job_workers, stop_job_workers
from workers.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    storage_service = get_storage_service()
    storage_service.ensure_bucket_exists()
    await init_pool()

    job_manager = JobManager()
    generation_provider = create_llm_provider(settings)
    background_generate_service = GenerateService(
        job_service=JobService(job_manager),
        provider=generation_provider,
        settings=settings,
    )

    app.state.job_manager = job_manager
    app.state.generation_provider = generation_provider

    worker_tasks = start_job_workers(
        job_manager,
        background_generate_service,
        settings.queue_worker_count,
    )
    scheduler_task = start_scheduler(
        settings.scheduler_interval_seconds,
        background_generate_service.run_scheduled_maintenance,
    )

    try:
        yield
    finally:
        await stop_scheduler(scheduler_task)
        await stop_job_workers(worker_tasks)
        await close_pool()

app = FastAPI(lifespan=lifespan)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/helloworld")
async def root():
    return {"message": "Hello World"}

app.include_router(recipes.router)
app.include_router(auth.router)
app.include_router(cookbooks.router)
app.include_router(generate.router)
app.include_router(storage.router)
