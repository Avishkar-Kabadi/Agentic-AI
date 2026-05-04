# app/models/email.py

from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime
from typing import Optional
from app.models.user import User


class EmailPriority(str):
    normal   = "normal"
    high     = "high"
    urgent   = "urgent"


class Email(Base):
    __tablename__ = "emails"

    id:      Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    # Gmail identifier — prevents re-syncing the same email
    gmail_message_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True, index=True)

    sender:  Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    subject: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    body:    Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    priority:   Mapped[str]  = mapped_column(String(20), default="normal")
    is_read:    Mapped[bool] = mapped_column(Boolean, default=False)
    is_replied: Mapped[bool] = mapped_column(Boolean, default=False)

    # When Google says it was received vs when we saved it
    received_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at:  Mapped[datetime]           = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="emails")