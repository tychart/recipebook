from fastapi import FastAPI, Response, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi import FastAPI
import pytesseract
from PIL import Image
from io import BytesIO

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

@app.post("/ocr")
async def perform_ocr(image: UploadFile = File(...)):
    try:
        # Read the uploaded image file
        contents = await image.read()
        img = Image.open(BytesIO(contents))
        
        # Perform OCR using Tesseract
        text = pytesseract.image_to_string(img)
        
        # Return the extracted text
        return JSONResponse(content={"text": text}, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    
app.include_router(recipes.router)
app.include_router(auth.router)
app.include_router(cookbooks.router)
app.include_router(generate.router)
