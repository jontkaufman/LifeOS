from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models.settings import AppSettings
from routers.settings import get_or_create_settings

router = APIRouter()


@router.get("/status")
async def get_status(db: AsyncSession = Depends(get_db)):
    settings = await get_or_create_settings(db)
    from config import get_configured_providers
    providers = get_configured_providers()
    # If an API key is already stored, auto-complete onboarding
    if providers and not settings.onboarding_completed:
        settings.onboarding_completed = True
        await db.commit()
    return {"completed": settings.onboarding_completed}


@router.post("/complete")
async def complete_onboarding(db: AsyncSession = Depends(get_db)):
    settings = await get_or_create_settings(db)
    settings.onboarding_completed = True
    await db.commit()
    # Trigger data seeding
    try:
        from services.data_seeder import seed_initial_data
        import asyncio
        asyncio.create_task(seed_initial_data())
    except Exception:
        pass
    return {"status": "ok"}
