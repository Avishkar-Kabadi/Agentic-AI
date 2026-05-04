# app/config.py
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Agentic AI Productivity Assistant"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite:///./assistant.db"

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Gemini
    GEMINI_API_KEY: str
    
    OAUTHLIB_INSECURE_TRANSPORT:str="1" 


    # Google OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/gmail/callback"

    # Redis + Celery (for later)
    REDIS_URL: str = "redis://localhost:6379"

    model_config = {"env_file": ".env"}


# This is what everything imports
settings = Settings()