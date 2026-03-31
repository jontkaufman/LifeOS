from datetime import datetime, date
from sqlalchemy import Integer, String, Text, Float, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    life_area_id: Mapped[int] = mapped_column(Integer, ForeignKey("life_areas.id"))
    goal_type: Mapped[str] = mapped_column(String(20), default="outcome")
    purpose_why: Mapped[str] = mapped_column(Text, default="")
    identity_statement: Mapped[str | None] = mapped_column(String(300), nullable=True)
    commitment_level: Mapped[int] = mapped_column(Integer, default=7)
    estimated_weekly_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    priority: Mapped[str] = mapped_column(String(10), default="medium")
    status: Mapped[str] = mapped_column(String(20), default="not_started")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    target_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    review_cadence: Mapped[str] = mapped_column(String(20), default="weekly")
    abandon_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    milestones: Mapped[list["Milestone"]] = relationship(back_populates="goal", cascade="all, delete-orphan", order_by="Milestone.sort_order")
    life_area: Mapped["LifeArea"] = relationship()


class Milestone(Base):
    __tablename__ = "milestones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    goal_id: Mapped[int] = mapped_column(Integer, ForeignKey("goals.id"))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    success_criteria: Mapped[str] = mapped_column(Text, default="")
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    target_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    goal: Mapped["Goal"] = relationship(back_populates="milestones")


# Needed for relationship resolution
from models.profile import LifeArea  # noqa: E402
