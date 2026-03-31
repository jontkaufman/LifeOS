from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.profile import UserProfile, LifeArea, CoachingIntake, LifeEvent

router = APIRouter()


async def get_or_create_profile(db: AsyncSession) -> UserProfile:
    result = await db.execute(select(UserProfile).where(UserProfile.id == 1))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = UserProfile(id=1)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile


async def get_or_create_intake(db: AsyncSession) -> CoachingIntake:
    result = await db.execute(select(CoachingIntake).where(CoachingIntake.id == 1))
    intake = result.scalar_one_or_none()
    if not intake:
        intake = CoachingIntake(id=1)
        db.add(intake)
        await db.commit()
        await db.refresh(intake)
    return intake


@router.get("")
async def get_profile(db: AsyncSession = Depends(get_db)):
    profile = await get_or_create_profile(db)
    intake = await get_or_create_intake(db)
    areas_result = await db.execute(select(LifeArea).where(LifeArea.is_active == True).order_by(LifeArea.sort_order))
    areas = areas_result.scalars().all()
    return {
        "profile": {c.key: getattr(profile, c.key) for c in UserProfile.__table__.columns},
        "intake": {c.key: getattr(intake, c.key) for c in CoachingIntake.__table__.columns},
        "life_areas": [{c.key: getattr(a, c.key) for c in LifeArea.__table__.columns} for a in areas],
    }


@router.put("")
async def update_profile(data: dict, db: AsyncSession = Depends(get_db)):
    profile = await get_or_create_profile(db)
    allowed = ["name", "preferred_name", "pronouns", "life_vision", "core_values",
               "current_context", "strengths", "growth_edges", "personality_data", "stage_of_change"]
    for key in allowed:
        if key in data:
            setattr(profile, key, data[key])
    await db.commit()
    return {"status": "ok"}


@router.get("/life-areas")
async def get_life_areas(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LifeArea).where(LifeArea.is_active == True).order_by(LifeArea.sort_order))
    areas = result.scalars().all()
    return [{c.key: getattr(a, c.key) for c in LifeArea.__table__.columns} for a in areas]


@router.post("/life-areas")
async def create_life_area(data: dict, db: AsyncSession = Depends(get_db)):
    area = LifeArea(**{k: v for k, v in data.items() if k in [
        "key", "name", "icon", "color", "description", "importance", "satisfaction", "sort_order"
    ]})
    db.add(area)
    await db.commit()
    await db.refresh(area)
    return {c.key: getattr(area, c.key) for c in LifeArea.__table__.columns}


@router.put("/life-areas/{area_id}")
async def update_life_area(area_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LifeArea).where(LifeArea.id == area_id))
    area = result.scalar_one_or_none()
    if not area:
        return {"error": "Not found"}
    allowed = ["name", "icon", "color", "description", "current_state", "importance",
               "satisfaction", "review_cadence", "sort_order", "is_active"]
    for key in allowed:
        if key in data:
            setattr(area, key, data[key])
    await db.commit()
    return {"status": "ok"}


@router.delete("/life-areas/{area_id}")
async def delete_life_area(area_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LifeArea).where(LifeArea.id == area_id))
    area = result.scalar_one_or_none()
    if area:
        area.is_active = False
        await db.commit()
    return {"status": "ok"}


@router.put("/coaching-intake")
async def update_intake(data: dict, db: AsyncSession = Depends(get_db)):
    intake = await get_or_create_intake(db)
    allowed = ["biggest_stressor", "past_coaching_experience", "support_system",
               "sleep_quality", "sleep_hours", "exercise_frequency", "energy_pattern", "energy_peaks"]
    for key in allowed:
        if key in data:
            setattr(intake, key, data[key])
    await db.commit()
    return {"status": "ok"}


@router.get("/life-events")
async def get_life_events(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LifeEvent).order_by(LifeEvent.date.desc()))
    events = result.scalars().all()
    return [{c.key: getattr(e, c.key) for c in LifeEvent.__table__.columns} for e in events]


@router.post("/life-events")
async def create_life_event(data: dict, db: AsyncSession = Depends(get_db)):
    event = LifeEvent(**{k: v for k, v in data.items() if k in [
        "date", "category", "title", "notes", "life_area_id"
    ]})
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return {c.key: getattr(event, c.key) for c in LifeEvent.__table__.columns}


@router.delete("/life-events/{event_id}")
async def delete_life_event(event_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LifeEvent).where(LifeEvent.id == event_id))
    event = result.scalar_one_or_none()
    if event:
        await db.delete(event)
        await db.commit()
    return {"status": "ok"}
