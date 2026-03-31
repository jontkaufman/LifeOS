from sqlalchemy import select
from database import async_session
from models.settings import AppSettings
from services.ai_provider import get_provider


async def seed_initial_data():
    """Called after onboarding completion. Generates initial suggestions."""
    async with async_session() as db:
        result = await db.execute(select(AppSettings).where(AppSettings.id == 1))
        settings = result.scalar_one_or_none()
        if not settings:
            return

        # This will be enhanced in Phase I
        # For now, just a placeholder
        pass
