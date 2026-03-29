import asyncio
import os

from openai import OpenAI

from schemas.recipe import RecipeMetadata

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "ollama")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL")

if OPENAI_API_KEY == "ollama":
    embedding_client = OpenAI(
        base_url=OLLAMA_URL,
        api_key="ollama",
    )
else:
    embedding_client = OpenAI(api_key=OPENAI_API_KEY)


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
    model = EMBEDDING_MODEL
    if model is None or not model.strip():
        raise RuntimeError("EMBEDDING_MODEL is not configured")
    return model.strip()


def get_embedding_vector_size() -> int:
    raw = os.getenv("EMBEDDING_VECTOR_SIZE", "1536").strip()
    try:
        size = int(raw)
    except ValueError as exc:
        raise RuntimeError("EMBEDDING_VECTOR_SIZE must be an integer") from exc
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


def _embed(model: str, text: str) -> list[float]:
    response = embedding_client.embeddings.create(model=model, input=text)
    if not response.data:
        raise RuntimeError("Embedding provider returned no embeddings")
    return _validate_embedding([float(value) for value in response.data[0].embedding])


async def embed_text(text: str, model: str | None = None) -> list[float]:
    resolved_model = model or get_embedding_model()
    return await asyncio.to_thread(_embed, resolved_model, text)
