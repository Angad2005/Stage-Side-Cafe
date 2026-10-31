import os
from pathlib import Path
from pydantic_settings import BaseSettings

_RENDER_EXTERNAL_URL = os.getenv("RENDER_EXTERNAL_URL", "")


def _find_env_file() -> Path:
    source_file = Path(__file__).resolve()
    for parent in source_file.parents:
        if (parent / ".env.example").is_file():
            return parent / ".env"
    # In the container, the repository template is not copied into the image.
    return source_file.parent.parent / ".env"


class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    APP_SECRET_KEY: str = "stageside-super-secure-production-secret-key-32bytes"
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        ",".join(filter(None, [
            "http://localhost:5173",
            "http://localhost:5174",
            "https://localhost:5174",
            _RENDER_EXTERNAL_URL,
        ])),
    )

    # Database & Redis
    DATABASE_URL: str = "postgresql+asyncpg://stageside:stageside@localhost:5432/stageside"
    STAGESIDE_DISABLE_PGVECTOR: bool = False
    REDIS_URL: str = "redis://localhost:6379/0"

    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "mock-openai-key")

    # LiveKit
    LIVEKIT_URL: str = "ws://localhost:7880"
    LIVEKIT_API_KEY: str = "devkey"
    LIVEKIT_API_SECRET: str = "secret"

    # Twitch OAuth
    TWITCH_CLIENT_ID: str = os.getenv("TWITCH_CLIENT_ID", "")
    TWITCH_CLIENT_SECRET: str = os.getenv("TWITCH_CLIENT_SECRET", "")
    TWITCH_REDIRECT_URI: str = os.getenv(
        "TWITCH_REDIRECT_URI",
        f"{_RENDER_EXTERNAL_URL or 'http://localhost:8000'}/api/v1/auth/twitch/callback",
    )
    TWITCH_EXTENSION_SECRET: str = os.getenv("TWITCH_EXTENSION_SECRET", "mock-ext-secret")
    WEB_APP_URL: str = os.getenv("WEB_APP_URL", _RENDER_EXTERNAL_URL or "http://localhost:5173")

    # AI Sentinel Thresholds
    SENTINEL_CONFIDENCE_THRESHOLD: float = 0.70
    SENTINEL_BLOCK_THRESHOLD: float = 0.85

    class Config:
        env_file = _find_env_file()
        extra = "allow"


settings = Settings()
