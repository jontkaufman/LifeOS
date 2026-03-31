from sqlalchemy import select
from database import async_session
from models.coaching import CoachingStyle

PRESET_STYLES = [
    {
        "name": "The Motivator",
        "description": "High-energy, Tony Robbins-inspired coaching that focuses on massive action, state change, and breakthrough moments.",
        "base_person": "Tony Robbins",
        "challenge_vs_support": 8, "tactical_specificity": 6, "emotional_depth": 6,
        "accountability_intensity": 9, "formality": 3, "humor": 6, "pace": 9,
        "spirituality": 4, "communication_style": "directives", "time_orientation": "future",
    },
    {
        "name": "The Empathetic Guide",
        "description": "Warm, Brené Brown-inspired coaching emphasizing vulnerability, shame resilience, and wholehearted living.",
        "base_person": "Brené Brown",
        "challenge_vs_support": 3, "tactical_specificity": 4, "emotional_depth": 10,
        "accountability_intensity": 4, "formality": 3, "humor": 5, "pace": 4,
        "spirituality": 5, "communication_style": "stories", "time_orientation": "present",
    },
    {
        "name": "The Strategist",
        "description": "Analytical, Tim Ferriss-inspired coaching focused on systems, optimization, and 80/20 thinking.",
        "base_person": "Tim Ferriss",
        "challenge_vs_support": 6, "tactical_specificity": 10, "emotional_depth": 3,
        "accountability_intensity": 7, "formality": 4, "humor": 6, "pace": 7,
        "spirituality": 2, "communication_style": "directives", "time_orientation": "future",
    },
    {
        "name": "The Mindful Coach",
        "description": "Calm, Tara Brach-inspired coaching rooted in mindfulness, self-compassion, and present-moment awareness.",
        "base_person": "Tara Brach",
        "challenge_vs_support": 2, "tactical_specificity": 3, "emotional_depth": 9,
        "accountability_intensity": 3, "formality": 4, "humor": 3, "pace": 2,
        "spirituality": 9, "communication_style": "questions", "time_orientation": "present",
    },
    {
        "name": "The Accountability Partner",
        "description": "Direct, Jocko Willink-inspired coaching emphasizing discipline, ownership, and no-excuses execution.",
        "base_person": "Jocko Willink",
        "challenge_vs_support": 10, "tactical_specificity": 8, "emotional_depth": 3,
        "accountability_intensity": 10, "formality": 5, "humor": 4, "pace": 8,
        "spirituality": 2, "communication_style": "directives", "time_orientation": "future",
    },
    {
        "name": "The Therapist-Coach",
        "description": "Insightful, Esther Perel-inspired coaching exploring patterns, relationships, and the stories we tell ourselves.",
        "base_person": "Esther Perel",
        "challenge_vs_support": 5, "tactical_specificity": 4, "emotional_depth": 9,
        "accountability_intensity": 5, "formality": 5, "humor": 5, "pace": 4,
        "spirituality": 4, "communication_style": "questions", "time_orientation": "past",
    },
    {
        "name": "The Habit Architect",
        "description": "Systematic, James Clear-inspired coaching focused on atomic habits, identity-based change, and environment design.",
        "base_person": "James Clear",
        "challenge_vs_support": 5, "tactical_specificity": 9, "emotional_depth": 4,
        "accountability_intensity": 7, "formality": 5, "humor": 5, "pace": 6,
        "spirituality": 2, "communication_style": "mixed", "time_orientation": "future",
    },
    {
        "name": "The Spiritual Mentor",
        "description": "Wisdom-oriented, Eckhart Tolle-inspired coaching connecting daily life to deeper purpose and presence.",
        "base_person": "Eckhart Tolle",
        "challenge_vs_support": 3, "tactical_specificity": 2, "emotional_depth": 8,
        "accountability_intensity": 2, "formality": 5, "humor": 4, "pace": 2,
        "spirituality": 10, "communication_style": "stories", "time_orientation": "present",
    },
    {
        "name": "The Executive Coach",
        "description": "Professional, Marshall Goldsmith-inspired coaching for leadership development and stakeholder-centered growth.",
        "base_person": "Marshall Goldsmith",
        "challenge_vs_support": 7, "tactical_specificity": 8, "emotional_depth": 5,
        "accountability_intensity": 8, "formality": 8, "humor": 4, "pace": 6,
        "spirituality": 2, "communication_style": "mixed", "time_orientation": "future",
    },
    {
        "name": "The Creative Catalyst",
        "description": "Playful, Elizabeth Gilbert-inspired coaching that unlocks creativity, curiosity, and permission to explore.",
        "base_person": "Elizabeth Gilbert",
        "challenge_vs_support": 3, "tactical_specificity": 4, "emotional_depth": 7,
        "accountability_intensity": 4, "formality": 2, "humor": 8, "pace": 5,
        "spirituality": 6, "communication_style": "stories", "time_orientation": "present",
    },
    {
        "name": "The Balanced Coach",
        "description": "Well-rounded coaching style that adapts to your needs, blending support with challenge in equal measure.",
        "base_person": None,
        "challenge_vs_support": 5, "tactical_specificity": 5, "emotional_depth": 5,
        "accountability_intensity": 5, "formality": 5, "humor": 5, "pace": 5,
        "spirituality": 5, "communication_style": "mixed", "time_orientation": "balanced",
    },
]


async def seed_coaching_styles():
    async with async_session() as session:
        result = await session.execute(select(CoachingStyle).where(CoachingStyle.is_preset == True).limit(1))
        if result.scalar_one_or_none() is not None:
            return
        for i, style_data in enumerate(PRESET_STYLES):
            style = CoachingStyle(**style_data, is_preset=True, is_active=(i == 10))
            session.add(style)
        await session.commit()
