from fastapi import FastAPI, Response, UploadFile, File
from fastapi.responses import JSONResponse
import pytesseract
from PIL import Image
from io import BytesIO

app = FastAPI()

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