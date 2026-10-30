import os
from pydantic_settings import BaseSettings

class ModerationConfig(BaseSettings):
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    INFERENCE_DEVICE: str = os.getenv("INFERENCE_DEVICE", "cpu")  # cuda or cpu
    MODEL_DIR: str = os.getenv("MODEL_DIR", "models")
    
    CONFIDENCE_THRESHOLD: float = 0.70
    BLOCK_THRESHOLD: float = 0.85
    FRAME_WIDTH: int = 384
    FRAME_HEIGHT: int = 384
    MAX_BATCH_SIZE: int = 8
    OCR_ENABLED: bool = True

    class Config:
        env_file = ".env"
        extra = "allow"

config = ModerationConfig()
