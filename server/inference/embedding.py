from routers.recipes import RecipeMetadata
from openai import OpenAI
import asyncpg


MODEL = "all-minilm"

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",  # required but unused by Ollama
)


async def embed_recipe(
    # db: asyncpg.Connection = Depends(get_db),
    recipe: RecipeMetadata
):
    print("starting embed_recipe")

    response = client.embeddings.create(
        input="Your text string goes here",
        model=MODEL
    )
    # print(response)
    print(response.data[0].embedding)