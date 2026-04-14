from functools import lru_cache

from openai import OpenAI

from core.config import Settings, get_settings


def _get_llm_base_url(settings: Settings) -> str:
    base_url = (settings.llm_base_url or "").strip()
    if not base_url:
        raise RuntimeError("LLM_BASE_URL is not configured")
    return base_url.rstrip("/")


def _get_llm_api_key(settings: Settings) -> str:
    api_key = (settings.llm_api_key or "ollama").strip()
    return api_key or "ollama"


def create_openai_client(settings: Settings) -> OpenAI:
    return OpenAI(
        base_url=_get_llm_base_url(settings),
        api_key=_get_llm_api_key(settings),
        timeout=settings.llm_request_timeout,
        max_retries=0,
    )


@lru_cache(maxsize=1)
def get_openai_client() -> OpenAI:
    return create_openai_client(get_settings())
