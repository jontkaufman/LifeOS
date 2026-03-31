import json
from datetime import datetime, date
from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import (UserProfile, LifeArea, CoachingIntake, LifeEvent,
                    CoachingStyle, CoachingBlend, CoachingBlendComponent, AssessmentResult,
                    Goal, Milestone, Review, ReviewAreaScore,
                    Conversation, Message, ActionItem, CoachingNote, AppSettings)

router = APIRouter()


class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


def table_to_list(rows, model):
    return [{c.key: getattr(r, c.key) for c in model.__table__.columns} for r in rows]


@router.get("/export")
async def export_data(db: AsyncSession = Depends(get_db)):
    data = {}
    for model in [UserProfile, LifeArea, CoachingIntake, LifeEvent, CoachingStyle,
                  CoachingBlend, CoachingBlendComponent, AssessmentResult,
                  Goal, Milestone, Review, ReviewAreaScore,
                  Conversation, Message, ActionItem, CoachingNote, AppSettings]:
        result = await db.execute(select(model))
        rows = result.scalars().all()
        data[model.__tablename__] = table_to_list(rows, model)

    return JSONResponse(
        content=json.loads(json.dumps(data, cls=DateTimeEncoder)),
        headers={"Content-Disposition": "attachment; filename=lifeos-export.json"}
    )


@router.post("/import")
async def import_data(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    try:
        content = await file.read()
        data = json.loads(content)

        model_map = {
            "user_profiles": UserProfile, "life_areas": LifeArea,
            "coaching_intakes": CoachingIntake, "life_events": LifeEvent,
            "coaching_styles": CoachingStyle, "coaching_blends": CoachingBlend,
            "coaching_blend_components": CoachingBlendComponent,
            "assessment_results": AssessmentResult,
            "goals": Goal, "milestones": Milestone,
            "reviews": Review, "review_area_scores": ReviewAreaScore,
            "conversations": Conversation, "messages": Message,
            "action_items": ActionItem, "coaching_notes": CoachingNote,
            "app_settings": AppSettings,
        }

        # Clear and reimport each table
        for table_name, model in model_map.items():
            if table_name in data:
                existing = await db.execute(select(model))
                for row in existing.scalars().all():
                    await db.delete(row)
                await db.flush()

                for row_data in data[table_name]:
                    # Convert date strings back
                    for key, val in row_data.items():
                        if isinstance(val, str) and 'T' in val:
                            try:
                                row_data[key] = datetime.fromisoformat(val)
                            except ValueError:
                                pass
                        elif isinstance(val, str) and len(val) == 10 and '-' in val:
                            try:
                                row_data[key] = date.fromisoformat(val)
                            except ValueError:
                                pass
                    obj = model(**row_data)
                    db.add(obj)

        await db.commit()
        return {"status": "ok", "tables_imported": list(data.keys())}
    except Exception as e:
        return {"status": "error", "error": str(e)}
