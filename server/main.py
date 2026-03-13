from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi import FastAPI

from database import close_pool, init_pool
<<<<<<< HEAD
from routers import recipes, auth, cookbooks, generate, ocr
=======
from routers import recipes, auth, cookbooks, generate, storage

from routers.storage import ensure_bucket_exists

>>>>>>> 075605fe8addbf5b404e161f5fb6e7ac672362c8

# ----------------------
# Startup Initilization
# ----------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure the S3 bucket exists during startup 
    # (for if this is the first time the app is run)
    ensure_bucket_exists()

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
app.include_router(ocr.router)
app.include_router(storage.router)
