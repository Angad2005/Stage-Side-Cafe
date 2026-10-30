import os
from pydantic_settings import BaseSettings

class GatewayConfig(BaseSettings):
    RTMP_HOST: str = "0.0.0.0"
    RTMP_PORT: int = 1935
    BUFFER_DURATION_SECONDS: float = 3.0  # 2 to 4 second pre-broadcast buffer
    FRAME_SAMPLE_RATE: int = 5            # 5 fps sampled for AI analysis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    MODERATION_SERVICE_URL: str = os.getenv("MODERATION_SERVICE_URL", "http://localhost:8001")
    LIVEKIT_URL: str = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
    LIVEKIT_API_KEY: str = "devkey"
    LIVEKIT_API_SECRET: str = "secret"
    TWITCH_RTMP_URL: str = os.getenv("TWITCH_RTMP_URL", "rtmp://live.twitch.tv/app")
    MAX_CAMERAS: int = 6
    FALLBACK_IMAGE_PATH: str = "assets/safe_fallback.png"

    class Config:
        env_file = ".env"
        extra = "allow"

config = GatewayConfig()
