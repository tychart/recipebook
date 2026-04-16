import asyncio
from types import SimpleNamespace

from core.config import Settings
from inference.recipe_import import (
    ImageRecipeMarkdownExtraction,
    ImportedIngredient,
    RecipeImportClient,
    RecipeImportExtraction,
    RecipeImportStageError,
    RecipeMarkdownExtraction,
)
from inference.recipe_import_prompts import (
    IMAGE_MARKDOWN_EXTRACTION_INSTRUCTIONS,
    STRUCTURED_RECIPE_INSTRUCTIONS,
    TEXT_MARKDOWN_EXTRACTION_INSTRUCTIONS,
)


class FakeResponses:
    def __init__(self, parsed_results):
        self.parsed_results = list(parsed_results)
        self.calls: list[dict] = []

    def parse(self, **kwargs):
        self.calls.append(kwargs)
        parsed_result = self.parsed_results.pop(0)
        if isinstance(parsed_result, Exception):
            raise parsed_result
        return SimpleNamespace(output_parsed=parsed_result)


class FakeOpenAIClient:
    def __init__(self, parsed_results):
        self.responses = FakeResponses(parsed_results)


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
        image_extraction_model="qwen3-vl:4b",
        text_extraction_model="qwen3:4b",
        structure_model="qwen3:4b",
        embedding_model=None,
        embedding_vector_size=1536,
        llm_request_timeout=60.0,
        queue_worker_count=1,
        scheduler_interval_seconds=60,
        job_retention_seconds=3600,
    )


def test_parse_text_uses_text_extractor_then_structure_model(monkeypatch):
    async def run():
        async def immediate_to_thread(func, *args):
            return func(*args)

        monkeypatch.setattr("inference.recipe_import.asyncio.to_thread", immediate_to_thread)
        fake_client = FakeOpenAIClient(
            [
                RecipeMarkdownExtraction(
                    markdown="# Recipe\nTitle: Brownies\n\n## Ingredients\n- 1 cup sugar\n\n## Instructions\n1. Mix"
                ),
                RecipeImportExtraction(
                    name="Brownies",
                    description="",
                    notes="",
                    servings=8,
                    category="Dessert",
                    tags=["sweet"],
                    ingredients=[ImportedIngredient(name="sugar", amount=1, unit="cup")],
                    instructions=["Mix"],
                ),
            ]
        )
        client = RecipeImportClient(make_settings(), client=fake_client)

        result = await client.parse_text("  Brownies\n1 cup sugar\nMix  ")

        assert result.intermediate_markdown.startswith("# Recipe")
        assert result.metadata == {
            "source": "text",
            "original_text": "  Brownies\n1 cup sugar\nMix  ",
        }
        assert result.recipe.name == "Brownies"

        extract_call, structure_call = fake_client.responses.calls
        assert extract_call["model"] == "qwen3:4b"
        assert extract_call["instructions"] == TEXT_MARKDOWN_EXTRACTION_INSTRUCTIONS
        assert extract_call["text_format"] is RecipeMarkdownExtraction
        assert extract_call["input"][0]["content"][0]["text"] == "<recipe_text>\n  Brownies\n1 cup sugar\nMix  \n</recipe_text>"

        assert structure_call["model"] == "qwen3:4b"
        assert structure_call["instructions"] == STRUCTURED_RECIPE_INSTRUCTIONS
        assert structure_call["text_format"] is RecipeImportExtraction
        assert structure_call["input"][0]["content"][0]["text"].startswith("<recipe_markdown>\n# Recipe")

    asyncio.run(run())


def test_parse_image_uses_vision_model_then_structure_model(monkeypatch):
    async def run():
        async def immediate_to_thread(func, *args):
            return func(*args)

        monkeypatch.setattr("inference.recipe_import.asyncio.to_thread", immediate_to_thread)
        fake_client = FakeOpenAIClient(
            [
                ImageRecipeMarkdownExtraction(
                    markdown="# Recipe\nTitle: Cosmic Brownies\n\n## Ingredients\n- 1 cup sugar\n\n## Instructions\n1. Mix",
                    transcription="Brownies\n1 cup sugar\nMix",
                ),
                RecipeImportExtraction(
                    name="Cosmic Brownies",
                    description="",
                    notes="",
                    servings=8,
                    category="Dessert",
                    tags=["sweet"],
                    ingredients=[ImportedIngredient(name="sugar", amount=1, unit="cup")],
                    instructions=["Mix"],
                ),
            ]
        )
        client = RecipeImportClient(make_settings(), client=fake_client)

        result = await client.parse_image(
            b"png-bytes",
            "brownies.png",
            "image/png",
            "Use the title Cosmic Brownies",
        )

        assert result.intermediate_markdown.startswith("# Recipe")
        assert result.metadata == {
            "source": "image",
            "filename": "brownies.png",
            "content_type": "image/png",
            "context_text": "Use the title Cosmic Brownies",
            "image_transcription": "Brownies\n1 cup sugar\nMix",
        }
        assert result.recipe.name == "Cosmic Brownies"

        extract_call, structure_call = fake_client.responses.calls
        assert extract_call["model"] == "qwen3-vl:4b"
        assert extract_call["instructions"] == IMAGE_MARKDOWN_EXTRACTION_INSTRUCTIONS
        assert extract_call["text_format"] is ImageRecipeMarkdownExtraction
        assert extract_call["timeout"] == 300.0
        assert extract_call["input"][0]["content"][0]["text"] == "<recipe_image>\nExtract the recipe from this image.\n</recipe_image>"
        assert extract_call["input"][0]["content"][1]["text"] == "<user_guidance>\nUse the title Cosmic Brownies\n</user_guidance>"
        assert extract_call["input"][0]["content"][2]["type"] == "input_image"
        assert extract_call["input"][0]["content"][2]["image_url"].startswith("data:image/png;base64,")

        assert structure_call["model"] == "qwen3:4b"
        assert structure_call["instructions"] == STRUCTURED_RECIPE_INSTRUCTIONS
        assert structure_call["input"][0]["content"][0]["text"] == (
            "<recipe_markdown>\n"
            "# Recipe\nTitle: Cosmic Brownies\n\n## Ingredients\n- 1 cup sugar\n\n## Instructions\n1. Mix\n"
            "</recipe_markdown>"
        )

    asyncio.run(run())


def test_parse_image_only_passes_user_guidance_to_stage_one(monkeypatch):
    async def run():
        async def immediate_to_thread(func, *args):
            return func(*args)

        monkeypatch.setattr("inference.recipe_import.asyncio.to_thread", immediate_to_thread)
        fake_client = FakeOpenAIClient(
            [
                ImageRecipeMarkdownExtraction(
                    markdown="# Recipe\nTitle: Brownies\n\n## Ingredients\n- 1 cup sugar\n\n## Instructions\n1. Mix",
                    transcription="Brownies\n1 cup sugar\nMix",
                ),
                RecipeImportExtraction(
                    name="Brownies",
                    description="",
                    notes="",
                    servings=8,
                    category="Dessert",
                    tags=[],
                    ingredients=[ImportedIngredient(name="sugar", amount=1, unit="cup")],
                    instructions=["Mix"],
                ),
            ]
        )
        client = RecipeImportClient(make_settings(), client=fake_client)

        await client.parse_image(b"png-bytes", "brownies.png", "image/png", "Please prefer grandma title")

        assert "Please prefer grandma title" in fake_client.responses.calls[0]["input"][0]["content"][1]["text"]
        assert "Please prefer grandma title" not in fake_client.responses.calls[1]["input"][0]["content"][0]["text"]

    asyncio.run(run())


def test_parse_text_raises_stage_error_with_intermediate_markdown(monkeypatch):
    async def run():
        async def immediate_to_thread(func, *args):
            return func(*args)

        monkeypatch.setattr("inference.recipe_import.asyncio.to_thread", immediate_to_thread)
        fake_client = FakeOpenAIClient(
            [
                RecipeMarkdownExtraction(
                    markdown="# Recipe\nTitle: Brownies\n\n## Ingredients\n- 1 cup sugar\n\n## Instructions\n1. Mix"
                ),
                RuntimeError("Formatter exploded"),
            ]
        )
        client = RecipeImportClient(make_settings(), client=fake_client)

        try:
            await client.parse_text("Brownies")
        except RecipeImportStageError as exc:
            assert str(exc) == "Formatter exploded"
            assert exc.intermediate_markdown.startswith("# Recipe")
            assert exc.metadata == {
                "source": "text",
                "original_text": "Brownies",
            }
            return

        raise AssertionError("Expected RecipeImportStageError")

    asyncio.run(run())
