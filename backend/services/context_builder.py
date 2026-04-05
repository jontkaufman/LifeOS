import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.profile import UserProfile, LifeArea, CoachingIntake
from models.goals import Goal
from models.reviews import Review, ReviewAreaScore
from models.coaching_notes import CoachingNote
from models.chat import Message


async def build_context(db: AsyncSession, messages: list, max_tokens: int = 4000) -> list:
    """Convert DB messages into chat format, trimming to fit token budget."""
    chat_messages = []
    for m in messages:
        if m.role in ("user", "assistant"):
            chat_messages.append({"role": m.role, "content": m.content})

    # Rough token estimate: 4 chars ≈ 1 token
    total_chars = sum(len(m["content"]) for m in chat_messages)
    max_chars = max_tokens * 4

    while total_chars > max_chars and len(chat_messages) > 2:
        removed = chat_messages.pop(0)
        total_chars -= len(removed["content"])

    return chat_messages


async def build_user_context(db: AsyncSession) -> str:
    """Build a summary of user data for system prompt injection.

    Reads from the pre-generated profile_summary.md if available,
    falling back to direct DB queries.
    """
    from config import DATA_DIR
    summary_path = DATA_DIR / "profile_summary.md"
    if summary_path.exists():
        content = summary_path.read_text(encoding="utf-8").strip()
        if content:
            return content

    # Fallback: build from DB
    parts = []

    result = await db.execute(select(UserProfile).where(UserProfile.id == 1))
    profile = result.scalar_one_or_none()
    if profile and profile.name:
        parts.append(f"User: {profile.preferred_name or profile.name}")
        if profile.life_vision:
            parts.append(f"Life Vision: {profile.life_vision}")
        if profile.core_values and profile.core_values != "[]":
            try:
                values = json.loads(profile.core_values)
                vals = [v["value"] if isinstance(v, dict) else v for v in values[:5]]
                parts.append(f"Core Values: {', '.join(vals)}")
            except (json.JSONDecodeError, KeyError):
                pass
        if profile.current_context:
            parts.append(f"Current Context: {profile.current_context}")
        if profile.strengths:
            parts.append(f"Strengths: {profile.strengths}")
        if profile.growth_edges:
            parts.append(f"Growth Edges: {profile.growth_edges}")

    result = await db.execute(select(LifeArea).where(LifeArea.is_active == True).order_by(LifeArea.sort_order))
    areas = result.scalars().all()
    if areas:
        area_strs = []
        for a in areas:
            area_strs.append(f"  {a.icon} {a.name}: importance={a.importance}/10, satisfaction={a.satisfaction}/10")
        parts.append("Life Areas:\n" + "\n".join(area_strs))

    result = await db.execute(select(Goal).where(Goal.status.in_(["not_started", "in_progress"])).limit(10))
    goals = result.scalars().all()
    if goals:
        goal_strs = [f"  - {g.title} ({g.status}, {g.progress}% done)" for g in goals]
        parts.append("Active Goals:\n" + "\n".join(goal_strs))

    result = await db.execute(select(Review).where(Review.is_completed == True).order_by(Review.date.desc()).limit(1))
    review = result.scalar_one_or_none()
    if review:
        parts.append(f"Latest Review ({review.date}): satisfaction={review.life_satisfaction}/10, energy={review.energy_level}/10, stress={review.stress_level}/10, mood={review.overall_mood}")

    result = await db.execute(
        select(CoachingNote).where(CoachingNote.is_active == True).order_by(CoachingNote.created_at.desc()).limit(5)
    )
    notes = result.scalars().all()
    if notes:
        note_strs = [f"  [{n.note_type}] {n.content[:100]}" for n in notes]
        parts.append("Coaching Notes:\n" + "\n".join(note_strs))

    return "\n\n".join(parts)


async def build_dashboard_context(db: AsyncSession) -> str:
    """Build context specifically for dashboard coaching message."""
    return await build_user_context(db)
