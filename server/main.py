from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi import FastAPI

from database import close_pool, init_pool
from routers import recipes, auth, cookbooks, generate

# ----------------------
# Lifespan for DB Pool
# ----------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    yield
    await close_pool()

app = FastAPI(lifespan=lifespan)

# ----------------------
# CORS Middleware
# ----------------------
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, OPTIONS, etc.
    allow_headers=["*"],  # Content-Type, Authorization, etc.
)

# ----------------------
# Routes
# ----------------------
@app.get("/api/helloworld")
async def root():
    return {"message": "Hello World"}

app.include_router(recipes.router)
app.include_router(auth.router)
app.include_router(cookbooks.router)
app.include_router(generate.router)