from datetime import datetime
from sqlalchemy import Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class CoachingNote(Base):
    __tablename__ = "coaching_notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    note_type: Mapped[str] = mapped_column(String(20))  # pattern/breakthrough/theme/risk/approach
    content: Mapped[str] = mapped_column(Text)
    source_type: Mapped[str] = mapped_column(String(20))  # chat/review/system
    source_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
