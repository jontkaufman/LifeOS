"""AI tool definitions and executor for chat-based goal/review/profile management."""

from datetime import datetime, date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

# ---------------------------------------------------------------------------
# A. Tool Definitions (provider-agnostic)
# ---------------------------------------------------------------------------

TOOLS = [
    {
        "name": "list_goals",
        "description": "List the user's goals, optionally filtered by status. Use this when the user asks about their goals, progress, or wants an overview.",
        "parameters": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": ["not_started", "in_progress", "completed", "paused", "abandoned"],
                    "description": "Filter goals by status. Omit to return all active goals (not_started + in_progress).",
                },
            },
            "required": [],
        },
    },
    {
        "name": "create_goal",
        "description": "Create a new goal for the user. Use when they express a desire to achieve something new.",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Short goal title"},
                "description": {"type": "string", "description": "Detailed description"},
                "life_area_key": {"type": "string", "description": "Life area key (e.g. 'health', 'career'). Omit to use first available area."},
                "priority": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
                "target_date": {"type": "string", "description": "Target date in YYYY-MM-DD format"},
                "purpose_why": {"type": "string", "description": "Why this goal matters"},
            },
            "required": ["title"],
        },
    },
    {
        "name": "update_goal",
        "description": "Update an existing goal's fields (status, progress, description, etc).",
        "parameters": {
            "type": "object",
            "properties": {
                "goal_id": {"type": "integer", "description": "ID of the goal to update"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "status": {"type": "string", "enum": ["not_started", "in_progress", "completed", "paused", "abandoned"]},
                "progress": {"type": "integer", "description": "0-100 progress percentage"},
                "priority": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
                "target_date": {"type": "string", "description": "YYYY-MM-DD"},
                "purpose_why": {"type": "string"},
            },
            "required": ["goal_id"],
        },
    },
    {
        "name": "delete_goal",
        "description": "Permanently delete a goal. Always confirm with the user before calling this.",
        "parameters": {
            "type": "object",
            "properties": {
                "goal_id": {"type": "integer", "description": "ID of the goal to delete"},
            },
            "required": ["goal_id"],
        },
    },
    {
        "name": "get_latest_review",
        "description": "Get the most recent review with area scores.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "update_review",
        "description": "Update fields on a review (gratitude, wins, challenges, scores, etc).",
        "parameters": {
            "type": "object",
            "properties": {
                "review_id": {"type": "integer"},
                "gratitude_1": {"type": "string"},
                "gratitude_2": {"type": "string"},
                "gratitude_3": {"type": "string"},
                "wins": {"type": "string"},
                "challenges": {"type": "string"},
                "avoiding": {"type": "string"},
                "unfulfilled_commitments": {"type": "string"},
                "lessons": {"type": "string"},
                "energy_sources": {"type": "string"},
                "energy_drains": {"type": "string"},
                "life_satisfaction": {"type": "integer", "description": "1-10"},
                "alignment_score": {"type": "integer", "description": "1-10"},
                "stress_level": {"type": "integer", "description": "1-10"},
                "energy_level": {"type": "integer", "description": "1-10"},
                "overall_mood": {"type": "string", "enum": ["terrible", "rough", "neutral", "good", "great"]},
                "next_week_priorities": {"type": "string"},
                "area_scores": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "life_area_id": {"type": "integer"},
                            "score": {"type": "integer", "description": "1-10"},
                            "note": {"type": "string"},
                        },
                        "required": ["life_area_id", "score"],
                    },
                    "description": "Area-specific satisfaction scores",
                },
            },
            "required": ["review_id"],
        },
    },
    {
        "name": "complete_review",
        "description": "Mark a review as completed.",
        "parameters": {
            "type": "object",
            "properties": {
                "review_id": {"type": "integer"},
            },
            "required": ["review_id"],
        },
    },
    {
        "name": "get_profile",
        "description": "Get the user's profile information and life areas.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "update_profile",
        "description": "Update user profile fields (name, vision, values, context, etc).",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "preferred_name": {"type": "string"},
                "pronouns": {"type": "string"},
                "life_vision": {"type": "string"},
                "core_values": {"type": "string", "description": "JSON array of values, e.g. '[\"growth\",\"health\"]'"},
                "current_context": {"type": "string"},
                "strengths": {"type": "string"},
                "growth_edges": {"type": "string"},
                "stage_of_change": {"type": "string"},
            },
            "required": [],
        },
    },
    {
        "name": "update_life_area",
        "description": "Update a life area's fields (satisfaction, importance, description, etc).",
        "parameters": {
            "type": "object",
            "properties": {
                "life_area_id": {"type": "integer"},
                "name": {"type": "string"},
                "description": {"type": "string"},
                "current_state": {"type": "string"},
                "importance": {"type": "integer", "description": "1-10"},
                "satisfaction": {"type": "integer", "description": "1-10"},
            },
            "required": ["life_area_id"],
        },
    },
    {
        "name": "list_calendar_events",
        "description": "List upcoming Google Calendar events. Use when the user asks about their schedule, upcoming events, or calendar.",
        "parameters": {
            "type": "object",
            "properties": {
                "days": {"type": "integer", "description": "Number of days ahead to fetch (default 7)"},
            },
            "required": [],
        },
    },
    {
        "name": "create_calendar_event",
        "description": "Create a new event on the user's Google Calendar. Use when they want to schedule something.",
        "parameters": {
            "type": "object",
            "properties": {
                "summary": {"type": "string", "description": "Event title"},
                "start": {"type": "string", "description": "Start time as ISO 8601 datetime (e.g. '2025-01-15T09:00:00-05:00') or YYYY-MM-DD for all-day events"},
                "end": {"type": "string", "description": "End time as ISO 8601 datetime or YYYY-MM-DD for all-day events"},
                "description": {"type": "string", "description": "Event description/notes"},
                "location": {"type": "string", "description": "Event location"},
                "all_day": {"type": "boolean", "description": "Whether this is an all-day event"},
            },
            "required": ["summary", "start", "end"],
        },
    },
    {
        "name": "update_calendar_event",
        "description": "Update an existing Google Calendar event. Only provided fields are changed.",
        "parameters": {
            "type": "object",
            "properties": {
                "event_id": {"type": "string", "description": "Google Calendar event ID"},
                "summary": {"type": "string", "description": "New event title"},
                "start": {"type": "string", "description": "New start time (ISO 8601)"},
                "end": {"type": "string", "description": "New end time (ISO 8601)"},
                "description": {"type": "string", "description": "New description"},
                "location": {"type": "string", "description": "New location"},
                "all_day": {"type": "boolean"},
            },
            "required": ["event_id"],
        },
    },
    {
        "name": "delete_calendar_event",
        "description": "Delete an event from the user's Google Calendar. Always confirm with the user before calling this.",
        "parameters": {
            "type": "object",
            "properties": {
                "event_id": {"type": "string", "description": "Google Calendar event ID to delete"},
            },
            "required": ["event_id"],
        },
    },
]


# ---------------------------------------------------------------------------
# B. Format Converters
# ---------------------------------------------------------------------------

def tools_for_anthropic() -> list[dict]:
    """Convert tools to Anthropic format."""
    return [
        {
            "name": t["name"],
            "description": t["description"],
            "input_schema": t["parameters"],
        }
        for t in TOOLS
    ]


def tools_for_openai() -> list[dict]:
    """Convert tools to OpenAI format."""
    return [
        {
            "type": "function",
            "function": {
                "name": t["name"],
                "description": t["description"],
                "parameters": t["parameters"],
            },
        }
        for t in TOOLS
    ]


# ---------------------------------------------------------------------------
# D. Display Names
# ---------------------------------------------------------------------------

TOOL_DISPLAY_NAMES: dict[str, str] = {
    "list_goals": "Checking goals",
    "create_goal": "Creating goal",
    "update_goal": "Updating goal",
    "delete_goal": "Deleting goal",
    "get_latest_review": "Loading review",
    "update_review": "Updating review",
    "complete_review": "Completing review",
    "get_profile": "Loading profile",
    "update_profile": "Updating profile",
    "update_life_area": "Updating life area",
    "list_calendar_events": "Checking calendar",
    "create_calendar_event": "Creating event",
    "update_calendar_event": "Updating event",
    "delete_calendar_event": "Deleting event",
}


# ---------------------------------------------------------------------------
# C. Tool Executor
# ---------------------------------------------------------------------------

async def execute_tool(name: str, args: dict, db: AsyncSession) -> dict:
    """Dispatch a tool call to the appropriate handler."""
    handlers = {
        "list_goals": _handle_list_goals,
        "create_goal": _handle_create_goal,
        "update_goal": _handle_update_goal,
        "delete_goal": _handle_delete_goal,
        "get_latest_review": _handle_get_latest_review,
        "update_review": _handle_update_review,
        "complete_review": _handle_complete_review,
        "get_profile": _handle_get_profile,
        "update_profile": _handle_update_profile,
        "update_life_area": _handle_update_life_area,
        "list_calendar_events": _handle_list_calendar_events,
        "create_calendar_event": _handle_create_calendar_event,
        "update_calendar_event": _handle_update_calendar_event,
        "delete_calendar_event": _handle_delete_calendar_event,
    }
    handler = handlers.get(name)
    if not handler:
        return {"error": f"Unknown tool: {name}"}
    try:
        return await handler(args, db)
    except Exception as e:
        return {"error": str(e)}


# -- Goal handlers --

async def _handle_list_goals(args: dict, db: AsyncSession) -> dict:
    from models.goals import Goal

    status = args.get("status")
    if status:
        query = select(Goal).where(Goal.status == status)
    else:
        query = select(Goal).where(Goal.status.in_(["not_started", "in_progress"]))

    result = await db.execute(query.order_by(Goal.created_at.desc()))
    goals = result.scalars().all()

    return {
        "goals": [
            {
                "id": g.id,
                "title": g.title,
                "description": g.description,
                "status": g.status,
                "progress": g.progress,
                "priority": g.priority,
                "target_date": str(g.target_date) if g.target_date else None,
                "life_area_id": g.life_area_id,
            }
            for g in goals
        ]
    }


async def _handle_create_goal(args: dict, db: AsyncSession) -> dict:
    from models.goals import Goal
    from models.profile import LifeArea

    # Resolve life area
    life_area_key = args.pop("life_area_key", None)
    life_area_id = None
    if life_area_key:
        result = await db.execute(select(LifeArea).where(LifeArea.key == life_area_key))
        area = result.scalar_one_or_none()
        if area:
            life_area_id = area.id

    if not life_area_id:
        result = await db.execute(select(LifeArea).where(LifeArea.is_active == True).order_by(LifeArea.sort_order).limit(1))
        area = result.scalar_one_or_none()
        life_area_id = area.id if area else 1

    target_date = None
    if args.get("target_date"):
        try:
            target_date = date.fromisoformat(args["target_date"])
        except ValueError:
            pass

    goal = Goal(
        title=args["title"],
        description=args.get("description", ""),
        life_area_id=life_area_id,
        priority=args.get("priority", "medium"),
        target_date=target_date,
        purpose_why=args.get("purpose_why", ""),
        status="not_started",
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return {"id": goal.id, "title": goal.title}


async def _handle_update_goal(args: dict, db: AsyncSession) -> dict:
    from models.goals import Goal

    result = await db.execute(select(Goal).where(Goal.id == args["goal_id"]))
    goal = result.scalar_one_or_none()
    if not goal:
        return {"error": f"Goal {args['goal_id']} not found"}

    updatable = ["title", "description", "status", "progress", "priority", "purpose_why"]
    for field in updatable:
        if field in args:
            setattr(goal, field, args[field])

    if "target_date" in args:
        try:
            goal.target_date = date.fromisoformat(args["target_date"])
        except (ValueError, TypeError):
            pass

    if args.get("status") == "completed":
        goal.completed_at = datetime.utcnow()

    await db.commit()
    return {"status": "updated"}


async def _handle_delete_goal(args: dict, db: AsyncSession) -> dict:
    from models.goals import Goal

    result = await db.execute(select(Goal).where(Goal.id == args["goal_id"]))
    goal = result.scalar_one_or_none()
    if not goal:
        return {"error": f"Goal {args['goal_id']} not found"}

    await db.delete(goal)
    await db.commit()
    return {"status": "deleted"}


# -- Review handlers --

async def _handle_get_latest_review(args: dict, db: AsyncSession) -> dict:
    from models.reviews import Review, ReviewAreaScore

    result = await db.execute(
        select(Review)
        .options(selectinload(Review.area_scores))
        .order_by(Review.date.desc())
        .limit(1)
    )
    review = result.scalar_one_or_none()
    if not review:
        return {"error": "No reviews found. The user hasn't started any reviews yet."}

    scores = [
        {"life_area_id": s.life_area_id, "score": s.score, "note": s.note or ""}
        for s in review.area_scores
    ]

    return {
        "id": review.id,
        "date": str(review.date),
        "is_completed": review.is_completed,
        "gratitude_1": review.gratitude_1,
        "gratitude_2": review.gratitude_2,
        "gratitude_3": review.gratitude_3,
        "wins": review.wins,
        "challenges": review.challenges,
        "avoiding": review.avoiding,
        "unfulfilled_commitments": review.unfulfilled_commitments,
        "lessons": review.lessons,
        "energy_sources": review.energy_sources,
        "energy_drains": review.energy_drains,
        "life_satisfaction": review.life_satisfaction,
        "alignment_score": review.alignment_score,
        "stress_level": review.stress_level,
        "energy_level": review.energy_level,
        "overall_mood": review.overall_mood,
        "next_week_priorities": review.next_week_priorities,
        "area_scores": scores,
    }


async def _handle_update_review(args: dict, db: AsyncSession) -> dict:
    from models.reviews import Review, ReviewAreaScore

    result = await db.execute(select(Review).where(Review.id == args["review_id"]))
    review = result.scalar_one_or_none()
    if not review:
        return {"error": f"Review {args['review_id']} not found"}

    text_fields = [
        "gratitude_1", "gratitude_2", "gratitude_3",
        "wins", "challenges", "avoiding", "unfulfilled_commitments",
        "lessons", "energy_sources", "energy_drains",
        "next_week_priorities", "overall_mood",
    ]
    int_fields = ["life_satisfaction", "alignment_score", "stress_level", "energy_level"]

    for field in text_fields:
        if field in args:
            setattr(review, field, args[field])
    for field in int_fields:
        if field in args:
            setattr(review, field, int(args[field]))

    # Handle area scores
    if "area_scores" in args:
        for score_data in args["area_scores"]:
            existing = await db.execute(
                select(ReviewAreaScore).where(
                    ReviewAreaScore.review_id == review.id,
                    ReviewAreaScore.life_area_id == score_data["life_area_id"],
                )
            )
            score_row = existing.scalar_one_or_none()
            if score_row:
                score_row.score = score_data["score"]
                if "note" in score_data:
                    score_row.note = score_data["note"]
            else:
                db.add(ReviewAreaScore(
                    review_id=review.id,
                    life_area_id=score_data["life_area_id"],
                    score=score_data["score"],
                    note=score_data.get("note", ""),
                ))

    await db.commit()
    return {"status": "updated"}


async def _handle_complete_review(args: dict, db: AsyncSession) -> dict:
    from models.reviews import Review

    result = await db.execute(select(Review).where(Review.id == args["review_id"]))
    review = result.scalar_one_or_none()
    if not review:
        return {"error": f"Review {args['review_id']} not found"}

    review.is_completed = True
    review.completed_at = datetime.utcnow()
    await db.commit()
    return {"status": "completed"}


# -- Profile handlers --

async def _handle_get_profile(args: dict, db: AsyncSession) -> dict:
    from models.profile import UserProfile, LifeArea

    result = await db.execute(select(UserProfile).where(UserProfile.id == 1))
    profile = result.scalar_one_or_none()

    result = await db.execute(
        select(LifeArea).where(LifeArea.is_active == True).order_by(LifeArea.sort_order)
    )
    areas = result.scalars().all()

    profile_data = {}
    if profile:
        profile_data = {
            "name": profile.name,
            "preferred_name": profile.preferred_name,
            "pronouns": profile.pronouns,
            "life_vision": profile.life_vision,
            "core_values": profile.core_values,
            "current_context": profile.current_context,
            "strengths": profile.strengths,
            "growth_edges": profile.growth_edges,
            "stage_of_change": profile.stage_of_change,
        }

    return {
        "profile": profile_data,
        "life_areas": [
            {
                "id": a.id,
                "key": a.key,
                "name": a.name,
                "importance": a.importance,
                "satisfaction": a.satisfaction,
                "description": a.description,
                "current_state": a.current_state,
            }
            for a in areas
        ],
    }


async def _handle_update_profile(args: dict, db: AsyncSession) -> dict:
    from models.profile import UserProfile

    result = await db.execute(select(UserProfile).where(UserProfile.id == 1))
    profile = result.scalar_one_or_none()
    if not profile:
        return {"error": "Profile not found"}

    updatable = [
        "name", "preferred_name", "pronouns", "life_vision",
        "core_values", "current_context", "strengths", "growth_edges",
        "stage_of_change",
    ]
    for field in updatable:
        if field in args:
            setattr(profile, field, args[field])

    await db.commit()
    return {"status": "updated"}


async def _handle_update_life_area(args: dict, db: AsyncSession) -> dict:
    from models.profile import LifeArea

    result = await db.execute(select(LifeArea).where(LifeArea.id == args["life_area_id"]))
    area = result.scalar_one_or_none()
    if not area:
        return {"error": f"Life area {args['life_area_id']} not found"}

    updatable = ["name", "description", "current_state", "importance", "satisfaction"]
    for field in updatable:
        if field in args:
            setattr(area, field, args[field])

    await db.commit()
    return {"status": "updated"}


# -- Calendar handlers --

async def _handle_list_calendar_events(args: dict, db: AsyncSession) -> dict:
    from services.google_calendar import fetch_events
    days = args.get("days", 7)
    try:
        events = await fetch_events(days_ahead=days)
        return {"events": events}
    except ValueError as e:
        return {"error": str(e)}


async def _handle_create_calendar_event(args: dict, db: AsyncSession) -> dict:
    from services.google_calendar import create_event
    try:
        event = await create_event(
            summary=args["summary"],
            start=args["start"],
            end=args["end"],
            description=args.get("description", ""),
            location=args.get("location", ""),
            all_day=args.get("all_day", False),
        )
        return event
    except Exception as e:
        return {"error": str(e)}


async def _handle_update_calendar_event(args: dict, db: AsyncSession) -> dict:
    from services.google_calendar import update_event
    try:
        event = await update_event(
            event_id=args["event_id"],
            summary=args.get("summary"),
            start=args.get("start"),
            end=args.get("end"),
            description=args.get("description"),
            location=args.get("location"),
            all_day=args.get("all_day"),
        )
        return event
    except Exception as e:
        return {"error": str(e)}


async def _handle_delete_calendar_event(args: dict, db: AsyncSession) -> dict:
    from services.google_calendar import delete_event
    try:
        await delete_event(args["event_id"])
        return {"status": "deleted"}
    except Exception as e:
        return {"error": str(e)}
