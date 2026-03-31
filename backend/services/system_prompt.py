from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.coaching import CoachingStyle, CoachingBlend, CoachingBlendComponent
from services.context_builder import build_user_context
from presets.chat_protocols import CLOSING_PROTOCOL

BASE_INSTRUCTIONS = """You are a personal life coach in the LifeOS platform. Your role is to help the user grow, achieve their goals, and live a fulfilling life.

Core principles:
- Be authentic and genuine, not robotic
- Remember context from previous conversations
- Balance support with appropriate challenge
- Respect boundaries while encouraging growth
- Celebrate wins, no matter how small
- Help identify patterns and blind spots
- Focus on what the user can control
- Encourage self-compassion alongside accountability"""

CRISIS_INSTRUCTIONS = """
IMPORTANT: The user may be in crisis. Prioritize:
1. Acknowledge their pain/distress with empathy
2. Assess immediate safety
3. Provide crisis resources: 988 Suicide & Crisis Lifeline (call/text 988), Crisis Text Line (text HOME to 741741)
4. Do NOT try to be a therapist - encourage professional help
5. Stay with them and be present
6. Do not minimize their experience"""

MODE_PROMPTS = {
    "open": "This is a free-form coaching session. Follow the user's lead.",
    "goal_review": "Focus this session on reviewing and strategizing around the user's goals. Help them assess progress, identify blockers, and plan next steps.",
    "check_in": "This is a brief check-in. Keep it focused and efficient. Ask about their current state, top priority, and any support needed.",
    "deep_session": "Go deeper in this session. Explore underlying patterns, beliefs, and emotions. Use powerful questions. Don't rush to solutions.",
    "crisis": CRISIS_INSTRUCTIONS,
    "accountability": "Focus on accountability. Review what was committed to vs. what happened. Be direct but compassionate. Help identify patterns in follow-through.",
    "brainstorming": "Be creative and expansive. Generate ideas freely. Build on the user's thoughts. Defer judgment. Go for quantity, then help narrow down.",
    "celebration": "Focus on celebrating and anchoring wins. Help the user fully feel and internalize their accomplishments. Connect wins to identity and values.",
    "decision_making": "Help work through a decision systematically. Explore options, values alignment, consequences, and gut feelings. Don't decide for them.",
    "reflection": "Guide reflective exploration. Help extract lessons, notice patterns, and integrate experiences. Use 'what' and 'how' questions more than 'why'.",
    "dashboard_message": "Generate a brief, warm coaching message for the user's dashboard. Be specific to their situation if context is available.",
}


def style_to_prompt(style: CoachingStyle) -> str:
    """Convert coaching style parameters into prompt instructions."""
    parts = [f"Coaching Style: {style.name}"]
    if style.description:
        parts.append(style.description)

    descriptors = []
    if style.challenge_vs_support >= 7:
        descriptors.append("Be more challenging and direct")
    elif style.challenge_vs_support <= 3:
        descriptors.append("Be more supportive and nurturing")

    if style.tactical_specificity >= 7:
        descriptors.append("Give specific, tactical advice with concrete steps")
    elif style.tactical_specificity <= 3:
        descriptors.append("Focus on big-picture thinking and meaning")

    if style.emotional_depth >= 7:
        descriptors.append("Explore emotions deeply, sit with feelings")
    elif style.emotional_depth <= 3:
        descriptors.append("Keep focus practical, don't dwell on emotions")

    if style.accountability_intensity >= 7:
        descriptors.append("Hold strongly accountable, no excuses accepted")
    elif style.accountability_intensity <= 3:
        descriptors.append("Be gentle with accountability, focus on encouragement")

    if style.formality >= 7:
        descriptors.append("Maintain a professional, formal tone")
    elif style.formality <= 3:
        descriptors.append("Be casual, friendly, and conversational")

    if style.humor >= 7:
        descriptors.append("Use humor and lightness frequently")
    elif style.humor <= 3:
        descriptors.append("Keep tone serious and focused")

    if style.pace >= 7:
        descriptors.append("Move quickly, be action-oriented")
    elif style.pace <= 3:
        descriptors.append("Take it slow, allow pauses and reflection")

    if style.spirituality >= 7:
        descriptors.append("Incorporate spiritual and philosophical perspectives")
    elif style.spirituality <= 3:
        descriptors.append("Stay practical and evidence-based")

    if style.communication_style == "questions":
        descriptors.append("Primarily use powerful questions to guide discovery")
    elif style.communication_style == "directives":
        descriptors.append("Give clear, direct guidance and recommendations")
    elif style.communication_style == "stories":
        descriptors.append("Use stories, metaphors, and examples")

    if style.time_orientation == "past":
        descriptors.append("Often explore past experiences for insight")
    elif style.time_orientation == "future":
        descriptors.append("Focus on future possibilities and vision")
    elif style.time_orientation == "present":
        descriptors.append("Anchor in present-moment awareness")

    if descriptors:
        parts.append("Style guidelines:\n- " + "\n- ".join(descriptors))

    if style.custom_system_prompt:
        parts.append(f"Additional instructions: {style.custom_system_prompt}")

    return "\n\n".join(parts)


TOOL_INSTRUCTIONS = """You have access to tools that let you directly manage the user's goals, weekly reviews, and profile.

Tool usage guidelines:
- READ before WRITE: Use get/list tools before making changes so you understand current state.
- Always confirm with the user before deleting anything.
- When creating goals, include as much detail as the user provides.
- When updating reviews, set individual fields — don't overwrite the entire review.
- Use life area IDs (not names) when the tool requires an ID. Get them from get_profile or get_current_review first.
- After making changes, briefly confirm what you did in your response."""


async def build_system_prompt(db: AsyncSession, mode: str = "open", crisis: dict = None, tools_enabled: bool = False) -> str:
    """Construct the full system prompt from all components."""
    parts = [BASE_INSTRUCTIONS]

    # Add coaching style
    result = await db.execute(select(CoachingStyle).where(CoachingStyle.is_active == True))
    active_style = result.scalar_one_or_none()

    if active_style:
        parts.append(style_to_prompt(active_style))
    else:
        # Check for active blend
        result = await db.execute(select(CoachingBlend).where(CoachingBlend.is_active == True))
        blend = result.scalar_one_or_none()
        if blend:
            comps_result = await db.execute(
                select(CoachingBlendComponent).where(CoachingBlendComponent.blend_id == blend.id)
            )
            components = comps_result.scalars().all()
            blend_parts = []
            for comp in components:
                style_result = await db.execute(select(CoachingStyle).where(CoachingStyle.id == comp.style_id))
                style = style_result.scalar_one_or_none()
                if style:
                    blend_parts.append(f"({int(comp.weight * 100)}% weight) {style_to_prompt(style)}")
            if blend_parts:
                parts.append(f"Blended Coaching Style: {blend.name}\n" + "\n---\n".join(blend_parts))

    # Add mode-specific prompt
    mode_prompt = MODE_PROMPTS.get(mode, MODE_PROMPTS["open"])
    parts.append(f"Session Mode: {mode}\n{mode_prompt}")

    # Add crisis override
    if crisis:
        parts.append(CRISIS_INSTRUCTIONS)

    # Add user context
    user_context = await build_user_context(db)
    if user_context:
        parts.append(f"User Context:\n{user_context}")

    # Add tool instructions if tools are enabled
    if tools_enabled:
        parts.append(TOOL_INSTRUCTIONS)

    # Add closing protocol reminder
    parts.append(f"When the conversation is wrapping up:\n{CLOSING_PROTOCOL}")

    return "\n\n---\n\n".join(parts)
