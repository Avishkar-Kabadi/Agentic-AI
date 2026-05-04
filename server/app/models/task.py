# app/models/task.py

import enum
from sqlalchemy import String, DateTime, ForeignKey, Enum, Boolean, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime
from typing import Optional
from app.models.user import User


class TaskPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class TaskStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


class Task(Base):
    __tablename__ = "tasks"

    id:          Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id:     Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    title:       Mapped[str]           = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    priority:       Mapped[TaskPriority] = mapped_column(Enum(TaskPriority), default=TaskPriority.medium)
    status:         Mapped[TaskStatus]   = mapped_column(Enum(TaskStatus),   default=TaskStatus.pending)

    due_date:       Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_ai_generated: Mapped[bool]             = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime]          = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="tasks")