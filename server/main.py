from fastapi import FastAPI

from routers import recipes, users, auth, cookbooks

app = FastAPI()

@app.get("/api/helloworld")
async def root():
    return {"message": "Hello World"}

app.include_router(recipes.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(cookbooks.router)