import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    APP_SECRET_KEY: str = "stageside-super-secure-production-secret-key-32bytes"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:5174", "https://localhost:5174"]
    
    # Database & Redis
    DATABASE_URL: str = "postgresql+asyncpg://stageside:stageside@localhost:5432/stageside"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "mock-openai-key")
    
    # LiveKit
    LIVEKIT_URL: str = "ws://localhost:7880"
    LIVEKIT_API_KEY: str = "devkey"
    LIVEKIT_API_SECRET: str = "secret"
    
    # Twitch
    TWITCH_CLIENT_ID: str = os.getenv("TWITCH_CLIENT_ID", "mock-client-id")
    TWITCH_CLIENT_SECRET: str = os.getenv("TWITCH_CLIENT_SECRET", "mock-client-secret")
    TWITCH_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/twitch/callback"
    TWITCH_EXTENSION_SECRET: str = os.getenv("TWITCH_EXTENSION_SECRET", "mock-ext-secret")
    
    # AI Sentinel Thresholds
    SENTINEL_CONFIDENCE_THRESHOLD: float = 0.70
    SENTINEL_BLOCK_THRESHOLD: float = 0.85
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
