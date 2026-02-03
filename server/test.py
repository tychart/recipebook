from fastapi import FastAPI, Response


app = FastAPI()


@app.get("/api/helloworld")
async def root():
    return {"message": "Hello World"}

"""
This block is just to stop error messages
from showing up when accessing from the browser
"""
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)
