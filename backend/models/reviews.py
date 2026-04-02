from datetime import datetime, date
from sqlalchemy import Integer, String, Text, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    review_type: Mapped[str] = mapped_column(String(20), default="review")
    week_id: Mapped[str | None] = mapped_column(String(10), nullable=True)
    date: Mapped[date] = mapped_column(Date)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)

    gratitude_1: Mapped[str] = mapped_column(Text, default="")
    gratitude_2: Mapped[str] = mapped_column(Text, default="")
    gratitude_3: Mapped[str] = mapped_column(Text, default="")

    wins: Mapped[str] = mapped_column(Text, default="")
    challenges: Mapped[str] = mapped_column(Text, default="")
    avoiding: Mapped[str] = mapped_column(Text, default="")
    unfulfilled_commitments: Mapped[str] = mapped_column(Text, default="")
    lessons: Mapped[str] = mapped_column(Text, default="")
    energy_sources: Mapped[str] = mapped_column(Text, default="")
    energy_drains: Mapped[str] = mapped_column(Text, default="")

    life_satisfaction: Mapped[int] = mapped_column(Integer, default=5)
    alignment_score: Mapped[int] = mapped_column(Integer, default=5)
    stress_level: Mapped[int] = mapped_column(Integer, default=5)
    energy_level: Mapped[int] = mapped_column(Integer, default=5)
    overall_mood: Mapped[str] = mapped_column(String(20), default="neutral")

    next_week_priorities: Mapped[str] = mapped_column(Text, default="")
    support_needed: Mapped[str] = mapped_column(String(30), default="accountability")

    ai_analysis: Mapped[str] = mapped_column(Text, default="")
    ai_notes: Mapped[str] = mapped_column(Text, default="")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    area_scores: Mapped[list["ReviewAreaScore"]] = relationship(back_populates="review", cascade="all, delete-orphan")


class ReviewAreaScore(Base):
    __tablename__ = "review_area_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    review_id: Mapped[int] = mapped_column(Integer, ForeignKey("reviews.id"))
    life_area_id: Mapped[int] = mapped_column(Integer, ForeignKey("life_areas.id"))
    score: Mapped[int] = mapped_column(Integer, default=5)
    previous_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    review: Mapped["Review"] = relationship(back_populates="area_scores")
