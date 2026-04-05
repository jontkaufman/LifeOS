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
    {"key": "spirituality", "name": "Spirituality & Faith", "icon": "🙏", "color": "#9B59B6", "sort_order": 8},
    {"key": "community", "name": "Community & Social Life", "icon": "🤝", "color": "#1ABC9C", "sort_order": 9},
    {"key": "education", "name": "Education & Learning", "icon": "📚", "color": "#3498DB", "sort_order": 10},
    {"key": "creativity", "name": "Creativity & Expression", "icon": "🎨", "color": "#E74C3C", "sort_order": 11},
]


async def seed_life_areas():
    async with async_session() as session:
        result = await session.execute(select(LifeArea))
        existing = {area.key: area for area in result.scalars().all()}

        if not existing:
            # Fresh DB — seed all areas as active defaults
            for area_data in DEFAULT_LIFE_AREAS:
                session.add(LifeArea(**area_data, is_default=True))
        else:
            # Existing DB — add only missing areas as inactive
            for area_data in DEFAULT_LIFE_AREAS:
                if area_data["key"] not in existing:
                    session.add(LifeArea(**area_data, is_default=True, is_active=False))

        await session.commit()
