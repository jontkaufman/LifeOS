from datetime import datetime, date
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database import get_db
from models.goals import Goal, Milestone


def _clean_goal_data(data: dict) -> dict:
    """Sanitize incoming goal data — convert date strings, strip nullish values."""
    cleaned = {}
    for k, v in data.items():
        if k == "target_date":
            if v:
                try:
                    cleaned[k] = date.fromisoformat(v) if isinstance(v, str) else v
                except (ValueError, TypeError):
                    pass
            else:
                cleaned[k] = None
        elif v is None:
            cleaned[k] = v
        else:
            cleaned[k] = v
    return cleaned

router = APIRouter()


def goal_to_dict(g):
    d = {c.key: getattr(g, c.key) for c in Goal.__table__.columns}
    d["milestones"] = [{c.key: getattr(m, c.key) for c in Milestone.__table__.columns} for m in (g.milestones or [])]
    if d.get("target_date"):
        d["target_date"] = str(d["target_date"])
    if d.get("created_at"):
        d["created_at"] = d["created_at"].isoformat()
    if d.get("updated_at"):
        d["updated_at"] = d["updated_at"].isoformat()
    if d.get("completed_at"):
        d["completed_at"] = d["completed_at"].isoformat()
    return d


@router.get("")
async def get_goals(status: str = None, life_area_id: int = None, db: AsyncSession = Depends(get_db)):
    query = select(Goal).options(selectinload(Goal.milestones))
    if status:
        query = query.where(Goal.status == status)
    if life_area_id:
        query = query.where(Goal.life_area_id == life_area_id)
    query = query.order_by(Goal.priority.desc(), Goal.created_at.desc())
    result = await db.execute(query)
    goals = result.scalars().all()
    return [goal_to_dict(g) for g in goals]


@router.get("/{goal_id}")
async def get_goal(goal_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Goal).options(selectinload(Goal.milestones)).where(Goal.id == goal_id))
    g = result.scalar_one_or_none()
    if not g:
        return {"error": "Not found"}
    return goal_to_dict(g)


@router.post("")
async def create_goal(data: dict, db: AsyncSession = Depends(get_db)):
    allowed = ["title", "description", "life_area_id", "goal_type", "purpose_why",
               "identity_statement", "commitment_level", "estimated_weekly_hours",
               "priority", "status", "target_date", "review_cadence"]
    cleaned = _clean_goal_data(data)
    goal = Goal(**{k: v for k, v in cleaned.items() if k in allowed and v is not None})
    # Set nullable fields explicitly
    for k in ["identity_statement", "estimated_weekly_hours", "target_date"]:
        if k in cleaned and cleaned[k] is None:
            setattr(goal, k, None)
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return {"id": goal.id, "status": "ok"}


@router.put("/{goal_id}")
async def update_goal(goal_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        return {"error": "Not found"}
    allowed = ["title", "description", "life_area_id", "goal_type", "purpose_why",
               "identity_statement", "commitment_level", "estimated_weekly_hours",
               "priority", "status", "progress", "target_date", "review_cadence", "abandon_reason"]
    cleaned = _clean_goal_data(data)
    for key in allowed:
        if key in cleaned:
            setattr(goal, key, cleaned[key])
    if data.get("status") == "completed" and not goal.completed_at:
        goal.completed_at = datetime.utcnow()
    await db.commit()
    return {"status": "ok"}


@router.delete("/{goal_id}")
async def delete_goal(goal_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = result.scalar_one_or_none()
    if goal:
        await db.delete(goal)
        await db.commit()
    return {"status": "ok"}


@router.post("/{goal_id}/milestones")
async def add_milestone(goal_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    allowed = ["title", "description", "success_criteria", "target_date", "sort_order"]
    milestone = Milestone(goal_id=goal_id, **{k: v for k, v in data.items() if k in allowed})
    db.add(milestone)
    await db.commit()
    await db.refresh(milestone)
    return {"id": milestone.id, "status": "ok"}


@router.put("/{goal_id}/milestones/{milestone_id}")
async def update_milestone(goal_id: int, milestone_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Milestone).where(Milestone.id == milestone_id, Milestone.goal_id == goal_id))
    m = result.scalar_one_or_none()
    if not m:
        return {"error": "Not found"}
    allowed = ["title", "description", "success_criteria", "is_completed", "target_date", "sort_order"]
    for key in allowed:
        if key in data:
            setattr(m, key, data[key])
    if data.get("is_completed") and not m.completed_at:
        m.completed_at = datetime.utcnow()
    await db.commit()
    return {"status": "ok"}


@router.delete("/{goal_id}/milestones/{milestone_id}")
async def delete_milestone(goal_id: int, milestone_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Milestone).where(Milestone.id == milestone_id, Milestone.goal_id == goal_id))
    m = result.scalar_one_or_none()
    if m:
        await db.delete(m)
        await db.commit()
    return {"status": "ok"}
