from fastapi import FastAPI, Response

app = FastAPI()

@app.get("/api/helloworld")
async def root():
    return {"message": "Hello World"}