from fastapi import FastAPI

from routers import recipes, auth, cookbooks, generate

app = FastAPI()

@app.get("/api/helloworld")
async def root():
    return {"message": "Hello World"}

app.include_router(recipes.router)
app.include_router(auth.router)
app.include_router(cookbooks.router)
app.include_router(generate.router)