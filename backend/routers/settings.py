from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.settings import AppSettings
from config import save_api_key, remove_api_key, get_configured_providers, get_api_key

router = APIRouter()


async def get_or_create_settings(db: AsyncSession) -> AppSettings:
    result = await db.execute(select(AppSettings).where(AppSettings.id == 1))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = AppSettings(id=1)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.get("")
async def get_settings(db: AsyncSession = Depends(get_db)):
    settings = await get_or_create_settings(db)
    return {
        "active_provider": settings.active_provider,
        "active_model": settings.active_model,
        "ollama_base_url": settings.ollama_base_url,
        "theme": settings.theme,
        "accent_color": settings.accent_color,
        "font_size": settings.font_size,
        "onboarding_completed": settings.onboarding_completed,
        "context_max_tokens": settings.context_max_tokens,
        "ai_temperature": settings.ai_temperature,
    }


@router.put("")
async def update_settings(data: dict, db: AsyncSession = Depends(get_db)):
    settings = await get_or_create_settings(db)
    allowed = ["active_provider", "active_model", "ollama_base_url", "theme",
               "accent_color", "font_size", "context_max_tokens", "ai_temperature"]
    for key in allowed:
        if key in data:
            setattr(settings, key, data[key])
    await db.commit()
    return {"status": "ok"}


@router.post("/api-key")
async def save_key(data: dict):
    save_api_key(data["provider"], data["key"])
    return {"status": "ok"}


@router.delete("/api-key/{provider}")
async def delete_key(provider: str):
    remove_api_key(provider)
    return {"status": "ok"}


@router.post("/api-key/test")
async def test_key(data: dict):
    provider = data.get("provider")
    key = data.get("key")
    if not key:
        key = get_api_key(provider)
    if not key:
        return {"valid": False, "error": "No API key provided"}
    try:
        if provider == "anthropic":
            import anthropic
            client = anthropic.Anthropic(api_key=key)
            client.messages.create(model="claude-sonnet-4-5-20250929", max_tokens=10, messages=[{"role": "user", "content": "hi"}])
        elif provider == "openai":
            from openai import OpenAI
            client = OpenAI(api_key=key)
            client.chat.completions.create(model="gpt-4o-mini", max_tokens=10, messages=[{"role": "user", "content": "hi"}])
        elif provider == "ollama":
            import httpx
            base_url = data.get("base_url", "http://localhost:11434")
            r = httpx.get(f"{base_url}/api/tags", timeout=5)
            r.raise_for_status()
        else:
            return {"valid": False, "error": f"Unknown provider: {provider}"}
        return {"valid": True}
    except Exception as e:
        return {"valid": False, "error": str(e)}


@router.get("/api-keys")
async def list_keys():
    return get_configured_providers()
