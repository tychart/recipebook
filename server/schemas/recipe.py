import datetime as dt

from pydantic import BaseModel


class Ingredient(BaseModel):
    ingredient_id: int | None = None
    recipe_id: int | None = None
    unit: str | None = None
    amount: float
    name: str


class Instruction(BaseModel):
    instruction_id: int | None = None
    recipe_id: int | None = None
    instruction_number: int
    instruction_text: str


class RecipeMetadata(BaseModel):
    id: int | None = None
    name: str
    ingredients: list[Ingredient]
    instructions: list[Instruction]
    notes: str | None = None
    description: str | None = None
    servings: int
    creator_id: int | None = None
    category: str
    image_url: str | None = None
    tags: list[str] | None = None
    cookbook_id: int
    modified_at: dt.datetime | None = None
