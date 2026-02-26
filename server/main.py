from contextlib import asynccontextmanager

from fastapi import FastAPI

from database import close_pool, init_pool
from routers import recipes, auth, cookbooks, generate


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    yield
    await close_pool()


app = FastAPI(lifespan=lifespan)


@app.get("/api/helloworld")
async def root():
    return {"message": "Hello World"}

app.include_router(recipes.router)
app.include_router(auth.router)
app.include_router(cookbooks.router)
app.include_router(generate.router)