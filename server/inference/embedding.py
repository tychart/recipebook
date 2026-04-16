from core.config import get_settings
from inference.openai_client import get_openai_client
from schemas.recipe import RecipeMetadata


def format_recipe_for_embedding(recipe: RecipeMetadata) -> str:
    parts: list[str] = [f"Title: {recipe.name}"]
    if recipe.description:
        parts.append(f"Description: {recipe.description}")
    if recipe.notes:
        parts.append(f"Notes: {recipe.notes}")
    parts.append(f"Category: {recipe.category}")
    parts.append(f"Servings: {recipe.servings}")
    if recipe.tags:
        parts.append("Tags: " + ", ".join(recipe.tags))

    ingredient_lines: list[str] = []
    for ingredient in recipe.ingredients:
        amount = f"{ingredient.amount:g}" if ingredient.amount is not None else ""
        unit = f" {ingredient.unit}" if ingredient.unit else ""
        ingredient_lines.append(f"- {amount}{unit} {ingredient.name}".strip())
    if ingredient_lines:
        parts.append("Ingredients:\n" + "\n".join(ingredient_lines))

    sorted_instructions = sorted(recipe.instructions, key=lambda item: item.instruction_number)
    if sorted_instructions:
        parts.append(
            "Instructions:\n"
            + "\n".join(
                f"{instruction.instruction_number}. {instruction.instruction_text}"
                for instruction in sorted_instructions
            )
        )

    return "\n\n".join(parts)


def get_embedding_model() -> str:
    model = get_settings().embedding_model
    if model is None or not model.strip():
        raise RuntimeError("EMBEDDING_MODEL is not configured")
    return model.strip()


def get_embedding_vector_size() -> int:
    size = get_settings().embedding_vector_size
    if size <= 0:
        raise RuntimeError("EMBEDDING_VECTOR_SIZE must be greater than zero")
    return size


def _validate_embedding(embedding: list[float]) -> list[float]:
    expected_dimensions = get_embedding_vector_size()
    if len(embedding) != expected_dimensions:
        raise RuntimeError(
            f"Embedding dimension mismatch: expected {expected_dimensions}, got {len(embedding)}"
        )
    return embedding


async def _embed(model: str, text: str) -> list[float]:
    response = await get_openai_client().embeddings.create(model=model, input=text)
    if not response.data:
        raise RuntimeError("Embedding provider returned no embeddings")
    return _validate_embedding([float(value) for value in response.data[0].embedding])


async def embed_text(text: str, model: str | None = None) -> list[float]:
    resolved_model = model or get_embedding_model()
    return await _embed(resolved_model, text)
