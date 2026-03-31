from sqlalchemy import select
from database import async_session
from models.profile import LifeArea

DEFAULT_LIFE_AREAS = [
    {"key": "career", "name": "Career & Work", "icon": "💼", "color": "#4A90D9", "sort_order": 0},
    {"key": "finances", "name": "Finances", "icon": "💰", "color": "#50C878", "sort_order": 1},
    {"key": "health", "name": "Health & Fitness", "icon": "🏃", "color": "#FF6B6B", "sort_order": 2},
    {"key": "relationships", "name": "Relationships", "icon": "❤️", "color": "#FF69B4", "sort_order": 3},
    {"key": "family", "name": "Family", "icon": "👨‍👩‍👧‍👦", "color": "#DDA0DD", "sort_order": 4},
    {"key": "personal_growth", "name": "Personal Growth", "icon": "🌱", "color": "#E8A838", "sort_order": 5},
    {"key": "fun_recreation", "name": "Fun & Recreation", "icon": "🎮", "color": "#FFD700", "sort_order": 6},
    {"key": "environment", "name": "Physical Environment", "icon": "🏠", "color": "#87CEEB", "sort_order": 7},
]


async def seed_life_areas():
    async with async_session() as session:
        result = await session.execute(select(LifeArea).limit(1))
        if result.scalar_one_or_none() is not None:
            return
        for area_data in DEFAULT_LIFE_AREAS:
            area = LifeArea(**area_data, is_default=True)
            session.add(area)
        await session.commit()
