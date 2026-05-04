# app/models/reminder.py

from sqlalchemy import String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime
from typing import Optional
from app.models.user import User


class Reminder(Base):
    __tablename__ = "reminders"

    id:         Mapped[int]      = mapped_column(primary_key=True, index=True)
    user_id:    Mapped[int]      = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    message:    Mapped[str]      = mapped_column(Text, nullable=False)  # Text, not String(255)
    remind_at:  Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_sent:    Mapped[bool]     = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="reminders")