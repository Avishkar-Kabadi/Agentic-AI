# app/models/user.py

from sqlalchemy import String, DateTime, Text, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime
from typing import Optional


class User(Base):
    __tablename__ = "users"

    id:            Mapped[int]          = mapped_column(primary_key=True, index=True)
    full_name:     Mapped[str]          = mapped_column(String(120), nullable=False)
    email:         Mapped[str]          = mapped_column(String(150), unique=True, nullable=False, index=True)
    password_hash: Mapped[str]          = mapped_column(String(255), nullable=False)

    created_at:    Mapped[datetime]         = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at:    Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Gmail OAuth
    gmail_access_token:  Mapped[Optional[str]]      = mapped_column(Text, nullable=True)
    gmail_refresh_token: Mapped[Optional[str]]      = mapped_column(Text, nullable=True)
    gmail_token_expiry:  Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    gmail_connected:     Mapped[bool]               = mapped_column(Boolean, default=False)

    # Relationships
    tasks     = relationship("Task",        back_populates="user", cascade="all, delete")
    emails    = relationship("Email",       back_populates="user", cascade="all, delete")
    reminders = relationship("Reminder",    back_populates="user", cascade="all, delete")
    memories  = relationship("AgentMemory", back_populates="user", cascade="all, delete")