import asyncio

from repositories.recipe_repo import (
    RecipeRepository,
    _embedding_to_vector,
    _normalize_optional_text,
)


class FakeConn:
    def __init__(self, rows=None):
        self.rows = rows or []
        self.fetch_calls: list[tuple[str, tuple[object, ...]]] = []
        self.fetchrow_calls: list[tuple[str, tuple[object, ...]]] = []

    async def fetch(self, query: str, *args):
        self.fetch_calls.append((query, args))
        return self.rows

    async def fetchrow(self, query: str, *args):
        self.fetchrow_calls.append((query, args))
        return {
            "recipe_id": 12,
            "recipe_name": args[0],
            "description": args[1],
            "notes": args[2],
            "servings": args[3],
            "creator_id": args[4],
            "modified_dttm": None,
            "category": args[5],
            "recipe_image_url": args[6],
            "recipe_tags": args[7],
            "book_id": args[8],
        }


def test_embedding_to_vector_formats_asyncpg_parameter():
    assert _embedding_to_vector([0.1, 2, -3.5]) == "[0.1,2.0,-3.5]"


def test_embedding_to_vector_rejects_empty_embedding():
    try:
        _embedding_to_vector([])
    except ValueError as exc:
        assert str(exc) == "Embedding must not be empty"
        return

    raise AssertionError("Expected ValueError for empty embedding")


def test_normalize_optional_text_keeps_none_and_trims_strings():
    assert _normalize_optional_text(None) is None
    assert _normalize_optional_text("  hello  ") == "hello"


def test_create_recipe_accepts_missing_optional_image_url():
    async def run():
        conn = FakeConn()
        repo = RecipeRepository(conn)

        recipe = await repo.create_recipe(
            name=" Brownies ",
            description=None,
            notes=None,
            servings=8,
            creator_id=7,
            category=" Dessert ",
            image_url=None,
            tags=["sweet"],
            cookbook_id=3,
        )

        assert len(conn.fetchrow_calls) == 1
        _, args = conn.fetchrow_calls[0]
        assert args[0] == "Brownies"
        assert args[1] is None
        assert args[2] is None
        assert args[5] == "Dessert"
        assert args[6] is None
        assert recipe.image_url is None

    asyncio.run(run())


def test_search_semantic_recipes_for_user_uses_vector_query_and_maps_results():
    async def run():
        conn = FakeConn(
            rows=[
                {
                    "recipe_id": 12,
                    "recipe_name": "Brownies",
                    "book_id": 3,
                    "book_name": "Dessert Vault",
                    "recipe_image_url": "recipes/3/brownies.png",
                    "category": "Dessert",
                    "recipe_tags": "sweet,chocolate",
                    "score": 0.98,
                }
            ]
        )
        repo = RecipeRepository(conn)

        results = await repo.search_semantic_recipes_for_user(
            user_id=7,
            embedding=[0.1, 0.2, 0.3],
            limit=5,
        )

        assert len(conn.fetch_calls) == 1
        query, args = conn.fetch_calls[0]
        assert "JOIN Cookbook c" in query
        assert "WHERE r.embedding IS NOT NULL" in query
        assert "Cookbook_Users" in query
        assert "ORDER BY r.embedding <=> $1::vector" in query
        assert args == ("[0.1,0.2,0.3]", 7, 5)

        assert [result.model_dump() for result in results] == [
            {
                "recipe_id": 12,
                "recipe_name": "Brownies",
                "cookbook_id": 3,
                "cookbook_name": "Dessert Vault",
                "image_url": "recipes/3/brownies.png",
                "category": "Dessert",
                "tags": ["sweet", "chocolate"],
                "score": 0.98,
            }
        ]

    asyncio.run(run())


def test_list_accessible_recipe_ids_for_user_filters_owned_or_shared_recipes():
    async def run():
        conn = FakeConn(rows=[{"recipe_id": 12}, {"recipe_id": 18}])
        repo = RecipeRepository(conn)

        recipe_ids = await repo.list_accessible_recipe_ids_for_user(7)

        assert recipe_ids == [12, 18]
        assert len(conn.fetch_calls) == 1
        query, args = conn.fetch_calls[0]
        assert "JOIN Cookbook c" in query
        assert "LEFT JOIN Cookbook_Users cu" in query
        assert "c.Owner_ID = $1" in query
        assert "cu.User_ID IS NOT NULL" in query
        assert args == (7,)

    asyncio.run(run())
