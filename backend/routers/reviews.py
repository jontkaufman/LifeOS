from datetime import datetime, date
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.reviews import Review, ReviewAreaScore
from models.profile import LifeArea

router = APIRouter()


def get_week_id(d: date = None) -> str:
    d = d or date.today()
    return f"{d.isocalendar()[0]}-W{d.isocalendar()[1]:02d}"


def review_to_dict(r, area_scores=None):
    d = {c.key: getattr(r, c.key) for c in Review.__table__.columns}
    for k in ["date"]:
        if d.get(k):
            d[k] = str(d[k])
    for k in ["created_at", "updated_at", "completed_at"]:
        if d.get(k):
            d[k] = d[k].isoformat()
    scores = area_scores if area_scores is not None else []
    d["area_scores"] = [{c.key: getattr(s, c.key) for c in ReviewAreaScore.__table__.columns} for s in scores]
    return d


@router.get("")
async def get_reviews(limit: int = 20, offset: int = 0, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review).order_by(Review.date.desc()).offset(offset).limit(limit)
    )
    reviews = result.scalars().all()
    out = []
    for r in reviews:
        scores_result = await db.execute(select(ReviewAreaScore).where(ReviewAreaScore.review_id == r.id))
        out.append(review_to_dict(r, scores_result.scalars().all()))
    return out


@router.get("/current")
async def get_current_review(db: AsyncSession = Depends(get_db)):
    week_id = get_week_id()
    result = await db.execute(select(Review).where(Review.week_id == week_id))
    review = result.scalar_one_or_none()
    if not review:
        review = Review(week_id=week_id, date=date.today())
        db.add(review)
        await db.flush()
        # Seed area scores
        areas_result = await db.execute(select(LifeArea).where(LifeArea.is_active == True))
        areas = areas_result.scalars().all()
        # Get previous review for previous scores
        prev_result = await db.execute(select(Review).where(Review.week_id != week_id).order_by(Review.date.desc()).limit(1))
        prev_review = prev_result.scalar_one_or_none()
        prev_scores = {}
        if prev_review:
            prev_scores_result = await db.execute(select(ReviewAreaScore).where(ReviewAreaScore.review_id == prev_review.id))
            for ps in prev_scores_result.scalars().all():
                prev_scores[ps.life_area_id] = ps.score
        for area in areas:
            score = ReviewAreaScore(
                review_id=review.id,
                life_area_id=area.id,
                score=5,
                previous_score=prev_scores.get(area.id),
            )
            db.add(score)
        await db.commit()
        await db.refresh(review)
        # Re-fetch with area_scores loaded
        result = await db.execute(select(Review).where(Review.id == review.id))
        review = result.scalar_one()
    scores_result = await db.execute(select(ReviewAreaScore).where(ReviewAreaScore.review_id == review.id))
    area_scores = scores_result.scalars().all()
    return review_to_dict(review, area_scores)


@router.get("/trends")
async def get_trends(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Review).where(Review.is_completed == True).order_by(Review.date.desc()).limit(12))
    reviews = result.scalars().all()
    trends = []
    for r in reviews:
        scores_result = await db.execute(select(ReviewAreaScore).where(ReviewAreaScore.review_id == r.id))
        area_scores = scores_result.scalars().all()
        trends.append({
            "week_id": r.week_id,
            "date": str(r.date),
            "life_satisfaction": r.life_satisfaction,
            "alignment_score": r.alignment_score,
            "stress_level": r.stress_level,
            "energy_level": r.energy_level,
            "mood": r.overall_mood,
            "area_scores": {s.life_area_id: s.score for s in area_scores},
        })
    return trends


@router.get("/{review_id}")
async def get_review(review_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        return {"error": "Not found"}
    scores_result = await db.execute(select(ReviewAreaScore).where(ReviewAreaScore.review_id == review.id))
    area_scores = scores_result.scalars().all()
    return review_to_dict(review, area_scores)


@router.put("/{review_id}")
async def update_review(review_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        return {"error": "Not found"}
    allowed = ["gratitude_1", "gratitude_2", "gratitude_3", "wins", "challenges",
               "avoiding", "unfulfilled_commitments", "lessons", "energy_sources", "energy_drains",
               "life_satisfaction", "alignment_score", "stress_level", "energy_level", "overall_mood",
               "next_week_priorities", "support_needed"]
    for key in allowed:
        if key in data:
            setattr(review, key, data[key])
    if "area_scores" in data:
        for score_data in data["area_scores"]:
            score_result = await db.execute(
                select(ReviewAreaScore).where(
                    ReviewAreaScore.review_id == review_id,
                    ReviewAreaScore.life_area_id == score_data["life_area_id"]
                )
            )
            score = score_result.scalar_one_or_none()
            if score:
                score.score = score_data["score"]
                if "note" in score_data:
                    score.note = score_data["note"]
    await db.commit()
    return {"status": "ok"}


@router.post("/{review_id}/complete")
async def complete_review(review_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        return {"error": "Not found"}
    review.is_completed = True
    review.completed_at = datetime.utcnow()
    await db.commit()
    # Trigger AI analysis asynchronously
    import asyncio
    asyncio.create_task(_generate_review_analysis(review_id))
    return {"status": "ok"}


async def _generate_review_analysis(review_id: int):
    try:
        from services.ai_provider import get_provider
        from routers.settings import get_or_create_settings
        async with get_db().__class__() as db:
            pass
    except Exception:
        pass  # Will be fully implemented in Phase G
