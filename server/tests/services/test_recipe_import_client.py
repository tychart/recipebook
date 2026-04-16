import asyncio
import logging
from types import SimpleNamespace

from core.config import Settings
from inference.recipe_import import (
    ImportedIngredient,
    RecipeImportClient,
    RecipeImportExtraction,
    RecipeImportStageError,
)
from inference.recipe_import_prompts import (
    IMAGE_MARKDOWN_EXTRACTION_INSTRUCTIONS,
    STRUCTURED_RECIPE_INSTRUCTIONS,
    TEXT_MARKDOWN_EXTRACTION_INSTRUCTIONS,
)


class FakeResponses:
    def __init__(self, create_results=None, parse_results=None):
        self.create_results = list(create_results or [])
        self.parse_results = list(parse_results or [])
        self.create_calls: list[dict] = []
        self.parse_calls: list[dict] = []

    async def create(self, **kwargs):
        self.create_calls.append(kwargs)
        result = self.create_results.pop(0)
        if isinstance(result, Exception):
            raise result
        return SimpleNamespace(output_text=result)

    async def parse(self, **kwargs):
        self.parse_calls.append(kwargs)
        result = self.parse_results.pop(0)
        if isinstance(result, Exception):
            raise result
        return SimpleNamespace(output_parsed=result)


class FakeOpenAIClient:
    def __init__(self, create_results=None, parse_results=None):
        self.responses = FakeResponses(create_results=create_results, parse_results=parse_results)


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


def test_parse_text_uses_responses_create_then_parse():
    async def run():
        first_stage_output = (
            "# Recipe\nTitle: Brownies\n\n## Ingredients\n- 1 cup sugar\n\n## Instructions\n1. Mix"
        )
        fake_client = FakeOpenAIClient(
            create_results=[first_stage_output],
            parse_results=[
                RecipeImportExtraction(
                    name="Brownies",
                    description="",
                    notes="",
                    servings=8,
                    category="Dessert",
                    tags=["sweet"],
                    ingredients=[ImportedIngredient(name="sugar", amount=1, unit="cup")],
                    instructions=["Mix"],
                )
            ],
        )
        client = RecipeImportClient(make_settings(), client=fake_client)

        result = await client.parse_text("  Brownies\n1 cup sugar\nMix  ")

        assert result.first_stage_output == first_stage_output
        assert result.metadata == {
            "source": "text",
            "original_text": "  Brownies\n1 cup sugar\nMix  ",
            "first_stage_output": first_stage_output,
        }
        assert result.recipe.name == "Brownies"

        create_call = fake_client.responses.create_calls[0]
        assert create_call["model"] == "qwen3:4b"
        assert create_call["input"][0] == {
            "role": "system",
            "content": TEXT_MARKDOWN_EXTRACTION_INSTRUCTIONS,
        }
        assert create_call["input"][1] == {
            "role": "user",
            "content": "<recipe_text>\n  Brownies\n1 cup sugar\nMix  \n</recipe_text>",
        }

        parse_call = fake_client.responses.parse_calls[0]
        assert parse_call["model"] == "qwen3:4b"
        assert parse_call["text_format"] is RecipeImportExtraction
        assert parse_call["input"][0] == {
            "role": "system",
            "content": STRUCTURED_RECIPE_INSTRUCTIONS,
        }
        assert parse_call["input"][1] == {
            "role": "user",
            "content": f"<first_stage_output>\n{first_stage_output}\n</first_stage_output>",
        }

    asyncio.run(run())


def test_parse_image_uses_unstructured_stage_one_output_and_minimal_metadata():
    async def run():
        first_stage_output = (
            "# Recipe\nTitle: Cosmic Brownies\n\n## Ingredients\n- 1 cup sugar\n\n## Instructions\n1. Mix"
            "\n\n## Transcription\nBrownies\n1 cup sugar\nMix"
        )
        fake_client = FakeOpenAIClient(
            create_results=[first_stage_output],
            parse_results=[
                RecipeImportExtraction(
                    name="Cosmic Brownies",
                    description="",
                    notes="",
                    servings=8,
                    category="Dessert",
                    tags=["sweet"],
                    ingredients=[ImportedIngredient(name="sugar", amount=1, unit="cup")],
                    instructions=["Mix"],
                )
            ],
        )
        client = RecipeImportClient(make_settings(), client=fake_client)

        result = await client.parse_image(
            b"png-bytes",
            "brownies.png",
            "image/png",
            "Use the title Cosmic Brownies",
        )

        assert result.first_stage_output == first_stage_output
        assert result.metadata == {
            "source": "image",
            "filename": "brownies.png",
            "content_type": "image/png",
            "context_text": "Use the title Cosmic Brownies",
            "first_stage_output": first_stage_output,
        }
        assert result.recipe.name == "Cosmic Brownies"

        create_call = fake_client.responses.create_calls[0]
        assert create_call["model"] == "qwen3-vl:4b"
        assert create_call["input"][0] == {
            "role": "system",
            "content": IMAGE_MARKDOWN_EXTRACTION_INSTRUCTIONS,
        }
        assert create_call["input"][1]["role"] == "user"
        assert create_call["input"][1]["content"][0]["text"] == "<recipe_image>\nExtract the recipe from this image.\n</recipe_image>"
        assert create_call["input"][1]["content"][1]["text"] == "<user_guidance>\nUse the title Cosmic Brownies\n</user_guidance>"
        assert create_call["input"][1]["content"][2]["type"] == "input_image"
        assert create_call["input"][1]["content"][2]["image_url"].startswith("data:image/png;base64,")

        parse_call = fake_client.responses.parse_calls[0]
        assert parse_call["input"][1]["content"] == (
            "<first_stage_output>\n"
            f"{first_stage_output}\n"
            "</first_stage_output>"
        )

    asyncio.run(run())


def test_parse_image_only_passes_user_guidance_to_stage_one():
    async def run():
        first_stage_output = "# Recipe\nTitle: Brownies"
        fake_client = FakeOpenAIClient(
            create_results=[first_stage_output],
            parse_results=[
                RecipeImportExtraction(
                    name="Brownies",
                    description="",
                    notes="",
                    servings=8,
                    category="Dessert",
                    tags=[],
                    ingredients=[ImportedIngredient(name="sugar", amount=1, unit="cup")],
                    instructions=["Mix"],
                )
            ],
        )
        client = RecipeImportClient(make_settings(), client=fake_client)

        await client.parse_image(b"png-bytes", "brownies.png", "image/png", "Please prefer grandma title")

        assert "Please prefer grandma title" in fake_client.responses.create_calls[0]["input"][1]["content"][1]["text"]
        assert "Please prefer grandma title" not in fake_client.responses.parse_calls[0]["input"][1]["content"]

    asyncio.run(run())


def test_parse_text_raises_stage_error_with_first_stage_output():
    async def run():
        first_stage_output = "# Recipe\nTitle: Brownies"
        fake_client = FakeOpenAIClient(
            create_results=[first_stage_output],
            parse_results=[RuntimeError("Formatter exploded")],
        )
        client = RecipeImportClient(make_settings(), client=fake_client)

        try:
            await client.parse_text("Brownies")
        except RecipeImportStageError as exc:
            assert str(exc) == "Formatter exploded"
            assert exc.first_stage_output == first_stage_output
            assert exc.metadata == {
                "source": "text",
                "original_text": "Brownies",
                "first_stage_output": first_stage_output,
            }
            return

        raise AssertionError("Expected RecipeImportStageError")

    asyncio.run(run())


def test_parse_text_logs_first_stage_output_at_debug(caplog):
    async def run():
        first_stage_output = "# Recipe\nTitle: Brownies"
        fake_client = FakeOpenAIClient(
            create_results=[first_stage_output],
            parse_results=[
                RecipeImportExtraction(
                    name="Brownies",
                    description="",
                    notes="",
                    servings=8,
                    category="Dessert",
                    tags=[],
                    ingredients=[ImportedIngredient(name="sugar", amount=1, unit="cup")],
                    instructions=["Mix"],
                )
            ],
        )
        client = RecipeImportClient(make_settings(), client=fake_client)

        with caplog.at_level(logging.DEBUG):
            await client.parse_text("Brownies")

        assert "Recipe import text stage 1 output" in caplog.text
        assert first_stage_output in caplog.text

    asyncio.run(run())
