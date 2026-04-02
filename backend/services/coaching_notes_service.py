import json
from sqlalchemy import select
from database import async_session
from models.chat import Conversation, Message
from models.coaching_notes import CoachingNote
from services.ai_provider import get_provider
from models.settings import AppSettings


async def generate_coaching_notes(conversation_id: int):
    """Generate coaching notes from a conversation."""
    async with async_session() as db:
        # Get settings
        result = await db.execute(select(AppSettings).where(AppSettings.id == 1))
        settings = result.scalar_one_or_none()
        if not settings:
            return

        # Get conversation messages
        msgs_result = await db.execute(
            select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
        )
        messages = msgs_result.scalars().all()
        if len(messages) < 6:
            return

        # Build conversation summary
        convo_text = "\n".join([f"{m.role}: {m.content[:500]}" for m in messages])

        provider = get_provider(settings)
        prompt = f"""Analyze this coaching conversation and extract notes in the following JSON format:
[
  {{"type": "pattern", "content": "..."}},
  {{"type": "breakthrough", "content": "..."}},
  {{"type": "theme", "content": "..."}},
  {{"type": "risk", "content": "..."}},
  {{"type": "approach", "content": "..."}}
]

Only include types where you have genuine observations. Be specific and concise.
Return ONLY valid JSON array, no other text.

Conversation:
{convo_text[:3000]}"""

        try:
            response = await provider.chat(
                messages=[{"role": "user", "content": prompt}],
                system="You are an expert coaching supervisor analyzing sessions. Return only valid JSON.",
            )
            notes = json.loads(response)
            for note_data in notes:
                note = CoachingNote(
                    note_type=note_data["type"],
                    content=note_data["content"],
                    source_type="chat",
                    source_id=conversation_id,
                )
                db.add(note)
            await db.commit()
        except Exception:
            pass


async def generate_review_notes(review_id: int):
    """Generate coaching notes from a completed review."""
    async with async_session() as db:
        from models.reviews import Review, ReviewAreaScore
        result = await db.execute(select(AppSettings).where(AppSettings.id == 1))
        settings = result.scalar_one_or_none()
        if not settings:
            return

        result = await db.execute(select(Review).where(Review.id == review_id))
        review = result.scalar_one_or_none()
        if not review:
            return

        review_text = f"""Review ({review.date}):
Wins: {review.wins}
Challenges: {review.challenges}
Avoiding: {review.avoiding}
Lessons: {review.lessons}
Satisfaction: {review.life_satisfaction}/10
Energy: {review.energy_level}/10
Stress: {review.stress_level}/10
Mood: {review.overall_mood}"""

        provider = get_provider(settings)
        prompt = f"""Analyze this weekly review and provide coaching notes as JSON array:
[{{"type": "pattern|theme|risk|approach", "content": "..."}}]
Return ONLY valid JSON.

{review_text}"""

        try:
            response = await provider.chat(
                messages=[{"role": "user", "content": prompt}],
                system="You are an expert coaching supervisor. Return only valid JSON.",
            )
            notes = json.loads(response)
            for note_data in notes:
                note = CoachingNote(
                    note_type=note_data["type"],
                    content=note_data["content"],
                    source_type="review",
                    source_id=review_id,
                )
                db.add(note)
            await db.commit()
        except Exception:
            pass
