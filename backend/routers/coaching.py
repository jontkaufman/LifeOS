from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.coaching import CoachingStyle, CoachingBlend, CoachingBlendComponent, AssessmentResult

router = APIRouter()


@router.get("/styles")
async def get_styles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CoachingStyle).order_by(CoachingStyle.is_preset.desc(), CoachingStyle.name))
    styles = result.scalars().all()
    return [{c.key: getattr(s, c.key) for c in CoachingStyle.__table__.columns} for s in styles]


@router.get("/styles/{style_id}")
async def get_style(style_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CoachingStyle).where(CoachingStyle.id == style_id))
    s = result.scalar_one_or_none()
    if not s:
        return {"error": "Not found"}
    return {c.key: getattr(s, c.key) for c in CoachingStyle.__table__.columns}


@router.post("/styles")
async def create_style(data: dict, db: AsyncSession = Depends(get_db)):
    allowed = ["name", "description", "base_person", "challenge_vs_support", "tactical_specificity",
               "emotional_depth", "accountability_intensity", "formality", "humor", "pace",
               "spirituality", "communication_style", "time_orientation", "custom_system_prompt"]
    style = CoachingStyle(**{k: v for k, v in data.items() if k in allowed})
    db.add(style)
    await db.commit()
    await db.refresh(style)
    return {c.key: getattr(style, c.key) for c in CoachingStyle.__table__.columns}


@router.put("/styles/{style_id}")
async def update_style(style_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CoachingStyle).where(CoachingStyle.id == style_id))
    style = result.scalar_one_or_none()
    if not style:
        return {"error": "Not found"}
    allowed = ["name", "description", "challenge_vs_support", "tactical_specificity",
               "emotional_depth", "accountability_intensity", "formality", "humor", "pace",
               "spirituality", "communication_style", "time_orientation", "custom_system_prompt"]
    for key in allowed:
        if key in data:
            setattr(style, key, data[key])
    await db.commit()
    return {"status": "ok"}


@router.delete("/styles/{style_id}")
async def delete_style(style_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CoachingStyle).where(CoachingStyle.id == style_id))
    style = result.scalar_one_or_none()
    if style and not style.is_preset:
        await db.delete(style)
        await db.commit()
    return {"status": "ok"}


@router.put("/styles/{style_id}/activate")
async def activate_style(style_id: int, db: AsyncSession = Depends(get_db)):
    # Deactivate all styles and blends
    result = await db.execute(select(CoachingStyle))
    for s in result.scalars().all():
        s.is_active = False
    result = await db.execute(select(CoachingBlend))
    for b in result.scalars().all():
        b.is_active = False
    # Activate selected
    result = await db.execute(select(CoachingStyle).where(CoachingStyle.id == style_id))
    style = result.scalar_one_or_none()
    if style:
        style.is_active = True
    await db.commit()
    return {"status": "ok"}


@router.get("/active")
async def get_active(db: AsyncSession = Depends(get_db)):
    # Check for active style
    result = await db.execute(select(CoachingStyle).where(CoachingStyle.is_active == True))
    style = result.scalar_one_or_none()
    if style:
        return {"type": "style", "data": {c.key: getattr(style, c.key) for c in CoachingStyle.__table__.columns}}
    # Check for active blend
    result = await db.execute(select(CoachingBlend).where(CoachingBlend.is_active == True))
    blend = result.scalar_one_or_none()
    if blend:
        return {"type": "blend", "data": {"id": blend.id, "name": blend.name}}
    return {"type": "none", "data": None}


@router.post("/generate-persona")
async def generate_persona(data: dict, db: AsyncSession = Depends(get_db)):
    from services.ai_provider import get_provider
    from routers.settings import get_or_create_settings
    settings = await get_or_create_settings(db)
    provider = get_provider(settings)
    person_name = data.get("person_name", "")
    prompt = f"""Generate coaching style parameters for a coach inspired by {person_name}.
Return JSON with these integer fields (1-10 scale):
challenge_vs_support, tactical_specificity, emotional_depth, accountability_intensity,
formality, humor, pace, spirituality
And these string fields:
communication_style (questions/directives/stories/mixed),
time_orientation (past/present/future/balanced),
description (2-3 sentences about this coaching style)
Return ONLY valid JSON, no other text."""
    response = await provider.chat(
        messages=[{"role": "user", "content": prompt}],
        system="You are a helpful assistant that returns only valid JSON."
    )
    import json
    try:
        params = json.loads(response)
        return params
    except json.JSONDecodeError:
        return {"error": "Failed to parse AI response"}


@router.get("/blends")
async def get_blends(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CoachingBlend))
    blends = result.scalars().all()
    out = []
    for b in blends:
        comps_result = await db.execute(
            select(CoachingBlendComponent).where(CoachingBlendComponent.blend_id == b.id)
        )
        components = comps_result.scalars().all()
        out.append({
            "id": b.id, "name": b.name, "is_active": b.is_active,
            "components": [{"style_id": c.style_id, "weight": c.weight} for c in components]
        })
    return out


@router.post("/blends")
async def create_blend(data: dict, db: AsyncSession = Depends(get_db)):
    blend = CoachingBlend(name=data.get("name", "Custom Blend"))
    db.add(blend)
    await db.flush()
    for comp in data.get("components", []):
        db.add(CoachingBlendComponent(blend_id=blend.id, style_id=comp["style_id"], weight=comp["weight"]))
    await db.commit()
    return {"id": blend.id, "status": "ok"}


@router.put("/blends/{blend_id}")
async def update_blend(blend_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CoachingBlend).where(CoachingBlend.id == blend_id))
    blend = result.scalar_one_or_none()
    if not blend:
        return {"error": "Not found"}
    if "name" in data:
        blend.name = data["name"]
    if "components" in data:
        comps = await db.execute(select(CoachingBlendComponent).where(CoachingBlendComponent.blend_id == blend_id))
        for c in comps.scalars().all():
            await db.delete(c)
        for comp in data["components"]:
            db.add(CoachingBlendComponent(blend_id=blend_id, style_id=comp["style_id"], weight=comp["weight"]))
    await db.commit()
    return {"status": "ok"}


@router.delete("/blends/{blend_id}")
async def delete_blend(blend_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CoachingBlend).where(CoachingBlend.id == blend_id))
    blend = result.scalar_one_or_none()
    if blend:
        await db.delete(blend)
        await db.commit()
    return {"status": "ok"}


@router.put("/blends/{blend_id}/activate")
async def activate_blend(blend_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CoachingStyle))
    for s in result.scalars().all():
        s.is_active = False
    result = await db.execute(select(CoachingBlend))
    for b in result.scalars().all():
        b.is_active = False
    result = await db.execute(select(CoachingBlend).where(CoachingBlend.id == blend_id))
    blend = result.scalar_one_or_none()
    if blend:
        blend.is_active = True
    await db.commit()
    return {"status": "ok"}


@router.get("/assessment")
async def get_assessment(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AssessmentResult).order_by(AssessmentResult.created_at.desc()).limit(1))
    assessment = result.scalar_one_or_none()
    if not assessment:
        return None
    return {c.key: getattr(assessment, c.key) for c in AssessmentResult.__table__.columns}


@router.post("/assessment")
async def save_assessment(data: dict, db: AsyncSession = Depends(get_db)):
    allowed = ["four_tendencies_type", "motivational_direction", "processing_style",
               "thinking_feeling", "emotional_regulation", "readiness_for_change",
               "spiritual_orientation", "raw_responses", "recommended_style_id"]
    assessment = AssessmentResult(**{k: v for k, v in data.items() if k in allowed})
    db.add(assessment)
    await db.commit()
    return {"status": "ok", "id": assessment.id}


@router.get("/notes")
async def get_notes(db: AsyncSession = Depends(get_db)):
    from models.coaching_notes import CoachingNote
    result = await db.execute(
        select(CoachingNote).where(CoachingNote.is_active == True).order_by(CoachingNote.created_at.desc())
    )
    notes = result.scalars().all()
    return [{c.key: getattr(n, c.key) for c in CoachingNote.__table__.columns} for n in notes]


@router.put("/notes/{note_id}")
async def update_note(note_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    from models.coaching_notes import CoachingNote
    result = await db.execute(select(CoachingNote).where(CoachingNote.id == note_id))
    note = result.scalar_one_or_none()
    if note and "content" in data:
        note.content = data["content"]
        await db.commit()
    return {"status": "ok"}
