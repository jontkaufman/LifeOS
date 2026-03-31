from datetime import datetime
from sqlalchemy import Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class CoachingStyle(Base):
    __tablename__ = "coaching_styles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text, default="")
    base_person: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_preset: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    challenge_vs_support: Mapped[int] = mapped_column(Integer, default=5)
    tactical_specificity: Mapped[int] = mapped_column(Integer, default=5)
    emotional_depth: Mapped[int] = mapped_column(Integer, default=5)
    accountability_intensity: Mapped[int] = mapped_column(Integer, default=5)
    formality: Mapped[int] = mapped_column(Integer, default=5)
    humor: Mapped[int] = mapped_column(Integer, default=5)
    pace: Mapped[int] = mapped_column(Integer, default=5)
    spirituality: Mapped[int] = mapped_column(Integer, default=5)
    communication_style: Mapped[str] = mapped_column(String(20), default="mixed")
    time_orientation: Mapped[str] = mapped_column(String(20), default="balanced")
    custom_system_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CoachingBlend(Base):
    __tablename__ = "coaching_blends"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    components: Mapped[list["CoachingBlendComponent"]] = relationship(back_populates="blend", cascade="all, delete-orphan")


class CoachingBlendComponent(Base):
    __tablename__ = "coaching_blend_components"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    blend_id: Mapped[int] = mapped_column(Integer, ForeignKey("coaching_blends.id"))
    style_id: Mapped[int] = mapped_column(Integer, ForeignKey("coaching_styles.id"))
    weight: Mapped[float] = mapped_column(Float, default=0.5)
    blend: Mapped["CoachingBlend"] = relationship(back_populates="components")
    style: Mapped["CoachingStyle"] = relationship()


class AssessmentResult(Base):
    __tablename__ = "assessment_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    four_tendencies_type: Mapped[str] = mapped_column(String(20), default="questioner")
    motivational_direction: Mapped[str] = mapped_column(String(20), default="toward")
    processing_style: Mapped[str] = mapped_column(String(20), default="mixed")
    thinking_feeling: Mapped[str] = mapped_column(String(20), default="balanced")
    emotional_regulation: Mapped[str] = mapped_column(String(30), default="solutions_first")
    readiness_for_change: Mapped[str] = mapped_column(String(20), default="preparing")
    spiritual_orientation: Mapped[str] = mapped_column(String(20), default="practical")
    raw_responses: Mapped[str] = mapped_column(Text, default="{}")
    recommended_style_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("coaching_styles.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
