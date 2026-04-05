"""Generate a condensed markdown profile summary for AI context injection."""

import json
import logging
from pathlib import Path
from sqlalchemy import select
from database import async_session
from models.profile import UserProfile, LifeArea, CoachingIntake
from models.goals import Goal
from models.reviews import Review
from models.coaching_notes import CoachingNote
from config import DATA_DIR

SUMMARY_PATH = DATA_DIR / "profile_summary.md"
log = logging.getLogger(__name__)


async def regenerate_profile_summary():
    """Query all profile data and write a condensed markdown file."""
    try:
        async with async_session() as db:
            md = await _build_summary(db)
        SUMMARY_PATH.write_text(md, encoding="utf-8")
        log.info("Profile summary regenerated (%d chars)", len(md))
    except Exception:
        log.exception("Failed to regenerate profile summary")


async def _build_summary(db) -> str:
    parts: list[str] = []

    # --- Profile ---
    result = await db.execute(select(UserProfile).where(UserProfile.id == 1))
    profile = result.scalar_one_or_none()
    if profile and profile.name:
        parts.append(f"# {profile.preferred_name or profile.name}")
        if profile.life_vision:
            parts.append(f"**Life Vision:** {profile.life_vision}")
        if profile.core_values and profile.core_values != "[]":
            try:
                values = json.loads(profile.core_values)
                vals = [v["value"] if isinstance(v, dict) else v for v in values[:8]]
                parts.append(f"**Core Values:** {', '.join(vals)}")
            except (json.JSONDecodeError, KeyError):
                pass
        if profile.current_context:
            parts.append(f"**Current Context:** {profile.current_context}")
        if profile.strengths:
            parts.append(f"**Strengths:** {profile.strengths}")
        if profile.growth_edges:
            parts.append(f"**Growth Edges:** {profile.growth_edges}")
        if profile.stage_of_change and profile.stage_of_change != "contemplating":
            parts.append(f"**Stage of Change:** {profile.stage_of_change}")

    # --- Life Areas ---
    result = await db.execute(
        select(LifeArea).where(LifeArea.is_active == True).order_by(LifeArea.sort_order)
    )
    areas = result.scalars().all()
    if areas:
        parts.append("\n## Life Areas")
        for a in areas:
            line = f"### {a.icon} {a.name} (importance {a.importance}/10, satisfaction {a.satisfaction}/10)"
            parts.append(line)
            if a.current_state:
                parts.append(f"- **Current State:** {a.current_state}")
            if a.goals:
                parts.append(f"- **Goals:** {a.goals}")
            if a.challenges:
                parts.append(f"- **Challenges:** {a.challenges}")
            if a.success_vision:
                parts.append(f"- **Success Vision:** {a.success_vision}")
            if a.additional_context:
                parts.append(f"- **Context:** {a.additional_context}")

    # --- Coaching Intake ---
    result = await db.execute(select(CoachingIntake).where(CoachingIntake.id == 1))
    intake = result.scalar_one_or_none()
    if intake:
        intake_lines = []
        if intake.biggest_stressor:
            intake_lines.append(f"- **Biggest Stressor:** {intake.biggest_stressor}")
        if intake.support_system:
            intake_lines.append(f"- **Support System:** {intake.support_system}")
        if intake.past_coaching_experience:
            intake_lines.append(f"- **Past Coaching:** {intake.past_coaching_experience}")
        intake_lines.append(
            f"- **Sleep:** {intake.sleep_hours}h, quality {intake.sleep_quality}/10 | "
            f"**Exercise:** {intake.exercise_frequency}x/week | "
            f"**Energy:** {intake.energy_pattern}"
        )
        if intake_lines:
            parts.append("\n## Coaching Intake")
            parts.extend(intake_lines)

    # --- Active Goals ---
    result = await db.execute(
        select(Goal).where(Goal.status.in_(["not_started", "in_progress"])).order_by(Goal.created_at.desc()).limit(15)
    )
    goals = result.scalars().all()
    if goals:
        parts.append("\n## Active Goals")
        for g in goals:
            line = f"- **{g.title}** ({g.status}, {g.progress}%)"
            if g.purpose_why:
                line += f" — {g.purpose_why}"
            parts.append(line)

    # --- Latest Review ---
    result = await db.execute(
        select(Review).where(Review.is_completed == True).order_by(Review.date.desc()).limit(1)
    )
    review = result.scalar_one_or_none()
    if review:
        parts.append(f"\n## Latest Review ({review.date})")
        parts.append(
            f"Satisfaction {review.life_satisfaction}/10, Energy {review.energy_level}/10, "
            f"Stress {review.stress_level}/10, Mood: {review.overall_mood}"
        )
        if review.wins:
            parts.append(f"- **Wins:** {review.wins}")
        if review.challenges:
            parts.append(f"- **Challenges:** {review.challenges}")
        if review.lessons:
            parts.append(f"- **Lessons:** {review.lessons}")

    # --- Coaching Notes ---
    result = await db.execute(
        select(CoachingNote).where(CoachingNote.is_active == True).order_by(CoachingNote.created_at.desc()).limit(5)
    )
    notes = result.scalars().all()
    if notes:
        parts.append("\n## Coaching Notes")
        for n in notes:
            parts.append(f"- [{n.note_type}] {n.content[:150]}")

    return "\n".join(parts)
