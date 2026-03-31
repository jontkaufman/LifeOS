from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models.settings import AppSettings
from routers.settings import get_or_create_settings

router = APIRouter()


@router.get("/status")
async def get_status(db: AsyncSession = Depends(get_db)):
    settings = await get_or_create_settings(db)
    if not settings.onboarding_completed:
        # Auto-complete if API keys exist or user data already present
        from config import get_configured_providers
        providers = get_configured_providers()
        if providers:
            settings.onboarding_completed = True
            await db.commit()
        else:
            # Check if profile or goals exist as a fallback signal
            from models.profile import UserProfile
            from models.goals import Goal
            profile = (await db.execute(select(UserProfile).limit(1))).scalar_one_or_none()
            has_data = profile and profile.full_name
            if not has_data:
                goal_count = (await db.execute(select(Goal).limit(1))).scalar_one_or_none()
                has_data = goal_count is not None
            if has_data:
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
