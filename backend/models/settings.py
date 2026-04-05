from datetime import datetime
from sqlalchemy import Integer, String, Float, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class AppSettings(Base):
    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    active_provider: Mapped[str] = mapped_column(String(20), default="anthropic")
    active_model: Mapped[str] = mapped_column(String(100), default="claude-sonnet-4-5-20250929")
    ollama_base_url: Mapped[str] = mapped_column(String(200), default="http://localhost:11434")
    theme: Mapped[str] = mapped_column(String(10), default="dark")
    accent_color: Mapped[str] = mapped_column(String(10), default="#E8A838")
    font_size: Mapped[str] = mapped_column(String(10), default="medium")
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    context_max_tokens: Mapped[int] = mapped_column(Integer, default=6000)
    ai_temperature: Mapped[float] = mapped_column(Float, default=0.7)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
