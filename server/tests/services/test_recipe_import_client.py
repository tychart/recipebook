import asyncio
from types import SimpleNamespace

from core.config import Settings
from inference.recipe_import import (
    IMAGE_IMPORT_INSTRUCTIONS,
    TEXT_IMPORT_INSTRUCTIONS,
    ImageRecipeImportExtraction,
    ImportedIngredient,
    RecipeImportClient,
    TextRecipeImportExtraction,
)


class FakeResponses:
    def __init__(self, parsed_result):
        self.parsed_result = parsed_result
        self.calls: list[dict] = []

    def parse(self, **kwargs):
        self.calls.append(kwargs)
        return SimpleNamespace(output_parsed=self.parsed_result)


class FakeOpenAIClient:
    def __init__(self, parsed_result):
        self.responses = FakeResponses(parsed_result)


def make_settings() -> Settings:
    return Settings(
        database_url="postgresql://localhost/test",
        cors_origins=("http://localhost:5173",),
        s3_endpoint="http://localhost:9000",
        s3_public_endpoint="http://localhost:9000",
        s3_key=None,
        s3_secret=None,
        s3_bucket="recipe-images",
        s3_region="us-east-1",
        llm_base_url="http://localhost:11434/v1",
        llm_api_key="ollama",
        llm_model="qwen3-vl:8b",
        embedding_model=None,
        embedding_vector_size=1536,
        llm_request_timeout=60.0,
        queue_worker_count=1,
        scheduler_interval_seconds=60,
        job_retention_seconds=3600,
    )


def test_parse_text_uses_compact_schema_and_preserves_original_text(monkeypatch):
    async def run():
        async def immediate_to_thread(func, *args):
            return func(*args)

        monkeypatch.setattr("inference.recipe_import.asyncio.to_thread", immediate_to_thread)
        fake_client = FakeOpenAIClient(
            TextRecipeImportExtraction(
                name="Brownies",
                description="",
                notes="",
                servings=8,
                category="Dessert",
                tags=["sweet"],
                ingredients=[ImportedIngredient(name="sugar", amount=1, unit="cup")],
                instructions=["Mix"],
            )
        )
        client = RecipeImportClient(make_settings(), client=fake_client)

        result = await client.parse_text("  Brownies\n1 cup sugar\nMix  ")

        assert result.transcription == "  Brownies\n1 cup sugar\nMix  "

        call = fake_client.responses.calls[0]
        assert call["instructions"] == TEXT_IMPORT_INSTRUCTIONS
        assert call["text_format"] is TextRecipeImportExtraction
        assert call["input"][0]["content"][0]["text"] == "<recipe_text>\n  Brownies\n1 cup sugar\nMix  \n</recipe_text>"

    asyncio.run(run())


def test_parse_image_uses_visible_image_transcription_schema_and_guidance_block(monkeypatch):
    async def run():
        async def immediate_to_thread(func, *args):
            return func(*args)

        monkeypatch.setattr("inference.recipe_import.asyncio.to_thread", immediate_to_thread)
        fake_client = FakeOpenAIClient(
            ImageRecipeImportExtraction(
                name="Brownies",
                description="",
                notes="",
                servings=8,
                category="Dessert",
                tags=["sweet"],
                ingredients=[ImportedIngredient(name="sugar", amount=1, unit="cup")],
                instructions=["Mix"],
                transcription="Brownies\n1 cup sugar\nMix",
            )
        )
        client = RecipeImportClient(make_settings(), client=fake_client)

        result = await client.parse_image(
            b"png-bytes",
            "brownies.png",
            "image/png",
            "Use the title Cosmic Brownies",
        )

        assert result.transcription == "Brownies\n1 cup sugar\nMix"

        call = fake_client.responses.calls[0]
        assert call["instructions"] == IMAGE_IMPORT_INSTRUCTIONS
        assert call["text_format"] is ImageRecipeImportExtraction
        assert call["timeout"] == 300.0
        assert call["input"][0]["content"][0]["text"] == "<recipe_image>\nExtract the recipe from this image.\n</recipe_image>"
        assert call["input"][0]["content"][1]["text"] == "<user_guidance>\nUse the title Cosmic Brownies\n</user_guidance>"
        assert call["input"][0]["content"][2]["type"] == "input_image"
        assert call["input"][0]["content"][2]["image_url"].startswith("data:image/png;base64,")

    asyncio.run(run())
