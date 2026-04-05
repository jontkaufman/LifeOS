from datetime import datetime, date
from sqlalchemy import Integer, String, Text, Float, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    name: Mapped[str] = mapped_column(String(200), default="")
    preferred_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pronouns: Mapped[str | None] = mapped_column(String(50), nullable=True)
    life_vision: Mapped[str] = mapped_column(Text, default="")
    core_values: Mapped[str] = mapped_column(Text, default="[]")
    current_context: Mapped[str] = mapped_column(Text, default="")
    strengths: Mapped[str] = mapped_column(Text, default="")
    growth_edges: Mapped[str] = mapped_column(Text, default="")
    personality_data: Mapped[str] = mapped_column(Text, default="{}")
    stage_of_change: Mapped[str] = mapped_column(String(50), default="contemplating")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LifeArea(Base):
    __tablename__ = "life_areas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    icon: Mapped[str] = mapped_column(String(10), default="📌")
    color: Mapped[str] = mapped_column(String(10), default="#E8A838")
    description: Mapped[str] = mapped_column(Text, default="")
    current_state: Mapped[str] = mapped_column(Text, default="")
    importance: Mapped[int] = mapped_column(Integer, default=5)
    satisfaction: Mapped[int] = mapped_column(Integer, default=5)
    goals: Mapped[str] = mapped_column(Text, default="")
    challenges: Mapped[str] = mapped_column(Text, default="")
    success_vision: Mapped[str] = mapped_column(Text, default="")
    additional_context: Mapped[str] = mapped_column(Text, default="")
    review_cadence: Mapped[str] = mapped_column(String(20), default="weekly")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CoachingIntake(Base):
    __tablename__ = "coaching_intakes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    biggest_stressor: Mapped[str] = mapped_column(Text, default="")
    past_coaching_experience: Mapped[str] = mapped_column(Text, default="")
    support_system: Mapped[str] = mapped_column(Text, default="")
    sleep_quality: Mapped[int] = mapped_column(Integer, default=5)
    sleep_hours: Mapped[float] = mapped_column(Float, default=7.0)
    exercise_frequency: Mapped[int] = mapped_column(Integer, default=3)
    energy_pattern: Mapped[str] = mapped_column(String(20), default="variable")
    energy_peaks: Mapped[str] = mapped_column(Text, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LifeEvent(Base):
    __tablename__ = "life_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date)
    category: Mapped[str] = mapped_column(String(50), default="other")
    title: Mapped[str] = mapped_column(String(200))
    notes: Mapped[str] = mapped_column(Text, default="")
    life_area_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("life_areas.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
