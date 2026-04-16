from openai import AsyncOpenAI

from core.config import Settings, get_settings

_shared_openai_client: AsyncOpenAI | None = None


def _get_llm_base_url(settings: Settings) -> str:
    base_url = (settings.llm_base_url or "").strip()
    if not base_url:
        raise RuntimeError("LLM_BASE_URL is not configured")
    return base_url.rstrip("/")


def _get_llm_api_key(settings: Settings) -> str:
    api_key = (settings.llm_api_key or "ollama").strip()
    return api_key or "ollama"


def create_openai_client(settings: Settings) -> AsyncOpenAI:
    return AsyncOpenAI(
        base_url=_get_llm_base_url(settings),
        api_key=_get_llm_api_key(settings),
        timeout=settings.llm_request_timeout,
        max_retries=0,
    )


def set_openai_client(client: AsyncOpenAI | None) -> None:
    global _shared_openai_client
    _shared_openai_client = client


def get_openai_client() -> AsyncOpenAI:
    global _shared_openai_client
    if _shared_openai_client is None:
        _shared_openai_client = create_openai_client(get_settings())
    return _shared_openai_client


async def close_openai_client() -> None:
    global _shared_openai_client
    if _shared_openai_client is None:
        return
    await _shared_openai_client.close()
    _shared_openai_client = None
