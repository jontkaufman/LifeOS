from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models.goals import Goal
from models.reviews import Review, ReviewAreaScore
from models.chat import ActionItem
from models.profile import LifeArea

router = APIRouter()


@router.get("")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    # Active goals summary
    goals_result = await db.execute(
        select(Goal).where(Goal.status.in_(["not_started", "in_progress"]))
    )
    goals = goals_result.scalars().all()

    # Latest review
    review_result = await db.execute(select(Review).order_by(Review.date.desc()).limit(1))
    latest_review = review_result.scalar_one_or_none()

    # Area scores from latest completed review
    area_scores = []
    if latest_review:
        scores_result = await db.execute(
            select(ReviewAreaScore).where(ReviewAreaScore.review_id == latest_review.id)
        )
        area_scores = scores_result.scalars().all()

    # Life areas
    areas_result = await db.execute(select(LifeArea).where(LifeArea.is_active == True).order_by(LifeArea.sort_order))
    areas = areas_result.scalars().all()

    # Action items
    items_result = await db.execute(
        select(ActionItem).where(ActionItem.is_completed == False).order_by(ActionItem.created_at.desc()).limit(10)
    )
    action_items = items_result.scalars().all()

    return {
        "goals": [{
            "id": g.id, "title": g.title, "status": g.status,
            "progress": g.progress, "life_area_id": g.life_area_id, "priority": g.priority,
        } for g in goals],
        "latest_review": {
            "week_id": latest_review.week_id,
            "life_satisfaction": latest_review.life_satisfaction,
            "energy_level": latest_review.energy_level,
            "stress_level": latest_review.stress_level,
            "overall_mood": latest_review.overall_mood,
            "is_completed": latest_review.is_completed,
        } if latest_review else None,
        "area_scores": [{
            "life_area_id": s.life_area_id,
            "score": s.score,
            "previous_score": s.previous_score,
        } for s in area_scores],
        "life_areas": [{
            "id": a.id, "key": a.key, "name": a.name, "icon": a.icon, "color": a.color,
            "importance": a.importance, "satisfaction": a.satisfaction,
        } for a in areas],
        "action_items": [{
            "id": i.id, "text": i.text, "is_completed": i.is_completed,
            "due_date": str(i.due_date) if i.due_date else None,
        } for i in action_items],
    }


@router.post("/coaching-message")
async def generate_coaching_message(db: AsyncSession = Depends(get_db)):
    from services.ai_provider import get_provider
    from services.context_builder import build_dashboard_context
    from services.system_prompt import build_system_prompt
    from routers.settings import get_or_create_settings

    settings = await get_or_create_settings(db)
    provider = get_provider(settings)
    context = await build_dashboard_context(db)
    system = await build_system_prompt(db, "dashboard_message")

    prompt = f"""Based on this user context, generate a brief, personalized coaching message (2-4 sentences) for their dashboard.
Be warm, specific to their situation, and actionable. Reference their recent data where relevant.

Context:
{context}"""

    try:
        response = await provider.chat(
            messages=[{"role": "user", "content": prompt}],
            system=system,
        )
        return {"message": response}
    except Exception as e:
        return {"message": "Welcome back! Take a moment to reflect on your progress and set your intention for today.", "error": str(e)}
