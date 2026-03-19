import math
from typing import Any

import asyncpg

from schemas.recipe import Ingredient, Instruction, RecipeMetadata


def _tags_to_text(tags: list[str] | None) -> str:
    if not tags:
        return "Main"
    return ",".join(tags)


def _text_to_tags(text: str | None) -> list[str]:
    if not text or not text.strip():
        return []
    return [part.strip() for part in text.split(",") if part.strip()]


def _embedding_to_vector(embedding: list[float] | None) -> str | None:
    if embedding is None:
        return None
    if not embedding:
        raise ValueError("Embedding must not be empty")

    values: list[str] = []
    for value in embedding:
        numeric_value = float(value)
        if not math.isfinite(numeric_value):
            raise ValueError("Embedding values must be finite numbers")
        values.append(str(numeric_value))

    return f"[{','.join(values)}]"


def _row_to_ingredient(row: asyncpg.Record) -> Ingredient:
    data = dict(row)
    return Ingredient(
        ingredient_id=data["ingredient_id"],
        recipe_id=data["recipe_id"],
        unit=data.get("unit") or "",
        amount=data["amount"],
        name=data["name"],
    )


def _row_to_instruction(row: asyncpg.Record) -> Instruction:
    data = dict(row)
    return Instruction(
        instruction_id=data["instruction_id"],
        recipe_id=data["recipe_id"],
        instruction_number=data["instruction_number"],
        instruction_text=data["instruction_text"],
    )


def _row_to_recipe(row: asyncpg.Record, ingredients: list[Ingredient], instructions: list[Instruction]) -> RecipeMetadata:
    data = dict(row)
    return RecipeMetadata(
        id=data["recipe_id"],
        name=data["recipe_name"],
        notes=data.get("notes"),
        description=data.get("description"),
        servings=data["servings"],
        creator_id=data["creator_id"],
        category=data["category"],
        image_url=data.get("recipe_image_url"),
        tags=_text_to_tags(data.get("recipe_tags")),
        cookbook_id=data["book_id"],
        modified_at=data.get("modified_dttm"),
        ingredients=ingredients,
        instructions=instructions,
    )


class RecipeRepository:
    def __init__(self, conn: asyncpg.Connection):
        self.conn = conn

    async def create_recipe(
        self,
        name: str,
        description: str | None,
        notes: str | None,
        servings: int,
        creator_id: int,
        category: str,
        image_url: str | None,
        tags: list[str] | None,
        cookbook_id: int,
    ) -> RecipeMetadata:
        row = await self.conn.fetchrow(
            """
            INSERT INTO Recipe (
                Recipe_name, Description, Notes, Servings, Creator_ID,
                Category, Recipe_Image_URL, Recipe_Tags, Book_ID
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING
                Recipe_ID, Recipe_name, Description, Notes, Servings, Creator_ID,
                Modified_DtTm, Category, Recipe_Image_URL, Recipe_Tags, Book_ID
            """,
            name,
            description,
            notes,
            servings,
            creator_id,
            category,
            image_url,
            _tags_to_text(tags),
            cookbook_id,
        )
        return _row_to_recipe(row, [], [])

    async def update_recipe(
        self,
        recipe_id: int,
        name: str,
        description: str | None,
        notes: str | None,
        servings: int,
        creator_id: int,
        category: str,
        image_url: str | None,
        tags: list[str] | None,
        cookbook_id: int,
    ) -> RecipeMetadata | None:
        row = await self.conn.fetchrow(
            """
            UPDATE Recipe
            SET Recipe_name = $1, Description = $2, Notes = $3, Servings = $4,
                Creator_ID = $5, Category = $6, Recipe_Image_URL = $7, Recipe_Tags = $8,
                Book_ID = $9, Modified_DtTm = CURRENT_TIMESTAMP
            WHERE Recipe_ID = $10
            RETURNING
                Recipe_ID, Recipe_name, Description, Notes, Servings, Creator_ID,
                Modified_DtTm, Category, Recipe_Image_URL, Recipe_Tags, Book_ID
            """,
            name,
            description,
            notes,
            servings,
            creator_id,
            category,
            image_url,
            _tags_to_text(tags),
            cookbook_id,
            recipe_id,
        )
        if row is None:
            return None
        return _row_to_recipe(row, [], [])

    async def update_recipe_embedding(self, recipe_id: int, embedding: list[float] | None) -> RecipeMetadata | None:
        row = await self.conn.fetchrow(
            """
            UPDATE Recipe
            SET embedding = $1::vector, Modified_DtTm = CURRENT_TIMESTAMP
            WHERE Recipe_ID = $2
            RETURNING
                Recipe_ID, Recipe_name, Description, Notes, Servings, Creator_ID,
                Modified_DtTm, Category, Recipe_Image_URL, Recipe_Tags, Book_ID
            """,
            _embedding_to_vector(embedding),
            recipe_id,
        )
        if row is None:
            return None
        return _row_to_recipe(row, [], [])

    async def get_recipe_row(self, recipe_id: int):
        return await self.conn.fetchrow(
            """
            SELECT
                Recipe_ID, Recipe_name, Description, Notes, Servings, Creator_ID,
                Modified_DtTm, Category, Recipe_Image_URL, Recipe_Tags, Book_ID
            FROM Recipe
            WHERE Recipe_ID = $1
            """,
            recipe_id,
        )

    async def list_recipe_rows(self, cookbook_id: int):
        return await self.conn.fetch(
            """
            SELECT
                Recipe_ID, Recipe_name, Description, Notes, Servings, Creator_ID,
                Modified_DtTm, Category, Recipe_Image_URL, Recipe_Tags, Book_ID
            FROM Recipe
            WHERE Book_ID = $1
            ORDER BY Modified_DtTm DESC
            """,
            cookbook_id,
        )

    async def get_recipe_cookbook_id(self, recipe_id: int) -> int | None:
        row = await self.conn.fetchrow(
            "SELECT Book_ID FROM Recipe WHERE Recipe_ID = $1",
            recipe_id,
        )
        if row is None:
            return None
        return row["book_id"]

    async def list_ingredients(self, recipe_id: int):
        return await self.conn.fetch(
            """
            SELECT Ingredient_ID, Recipe_ID, Amount, Unit, Name
            FROM Ingredients
            WHERE Recipe_ID = $1
            ORDER BY Ingredient_ID
            """,
            recipe_id,
        )

    async def list_instructions(self, recipe_id: int):
        return await self.conn.fetch(
            """
            SELECT Instruction_ID, Recipe_ID, Instruction_Number, Instruction_Text
            FROM Instructions
            WHERE Recipe_ID = $1
            ORDER BY Instruction_Number, Instruction_ID
            """,
            recipe_id,
        )

    async def replace_ingredients(self, recipe_id: int, ingredients: list[Ingredient]) -> None:
        await self.delete_ingredients(recipe_id)
        await self.insert_ingredients(recipe_id, ingredients)

    async def replace_instructions(self, recipe_id: int, instructions: list[Instruction]) -> None:
        await self.delete_instructions(recipe_id)
        await self.insert_instructions(recipe_id, instructions)

    async def insert_ingredients(self, recipe_id: int, ingredients: list[Ingredient]) -> None:
        for ingredient in ingredients:
            await self.conn.execute(
                """
                INSERT INTO Ingredients (Recipe_ID, Amount, Unit, Name)
                VALUES ($1, $2, $3, $4)
                """,
                recipe_id,
                ingredient.amount,
                ingredient.unit or "",
                ingredient.name,
            )

    async def insert_instructions(self, recipe_id: int, instructions: list[Instruction]) -> None:
        for instruction in instructions:
            await self.conn.execute(
                """
                INSERT INTO Instructions (Recipe_ID, Instruction_Number, Instruction_Text)
                VALUES ($1, $2, $3)
                """,
                recipe_id,
                instruction.instruction_number,
                instruction.instruction_text,
            )

    async def delete_ingredients(self, recipe_id: int) -> None:
        await self.conn.execute("DELETE FROM Ingredients WHERE Recipe_ID = $1", recipe_id)

    async def delete_instructions(self, recipe_id: int) -> None:
        await self.conn.execute("DELETE FROM Instructions WHERE Recipe_ID = $1", recipe_id)

    async def delete_recipe(self, recipe_id: int) -> int | None:
        row = await self.conn.fetchrow(
            "DELETE FROM Recipe WHERE Recipe_ID = $1 RETURNING Recipe_ID",
            recipe_id,
        )
        if row is None:
            return None
        return row["recipe_id"]

    async def build_recipe(self, recipe_row: asyncpg.Record) -> RecipeMetadata:
        ingredients = [_row_to_ingredient(row) for row in await self.list_ingredients(recipe_row["recipe_id"])]
        instructions = [_row_to_instruction(row) for row in await self.list_instructions(recipe_row["recipe_id"])]
        return _row_to_recipe(recipe_row, ingredients, instructions)

    async def get_recipe(self, recipe_id: int) -> RecipeMetadata | None:
        recipe_row = await self.get_recipe_row(recipe_id)
        if recipe_row is None:
            return None
        return await self.build_recipe(recipe_row)

    async def list_recipes(self, cookbook_id: int) -> list[RecipeMetadata]:
        rows = await self.list_recipe_rows(cookbook_id)
        recipes: list[RecipeMetadata] = []
        for row in rows:
            recipes.append(await self.build_recipe(row))
        return recipes

    def clone_recipe_payload(self, recipe: RecipeMetadata, cookbook_id: int) -> dict[str, Any]:
        return {
            "name": recipe.name,
            "description": recipe.description,
            "notes": recipe.notes,
            "servings": recipe.servings,
            "creator_id": recipe.creator_id,
            "category": recipe.category,
            "image_url": recipe.image_url,
            "tags": recipe.tags,
            "cookbook_id": cookbook_id,
            "ingredients": recipe.ingredients,
            "instructions": recipe.instructions,
        }
