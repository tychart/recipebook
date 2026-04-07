from pydantic import BaseModel, Field


class GenerateSearchRequest(BaseModel):
    query: str
    limit: int = Field(default=10, ge=1, le=25)


class GenerateSearchResult(BaseModel):
    recipe_id: int
    recipe_name: str
    cookbook_id: int
    cookbook_name: str
    image_url: str | None = None
    category: str
    tags: list[str] | None = None
    score: float
