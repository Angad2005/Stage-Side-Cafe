import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, redis_manager
from app.auth.router import router as auth_router
from app.streams.router import router as streams_router
from app.cameras.router import router as cameras_router
from app.sentinel.router import router as sentinel_router
from app.communities.router import router as communities_router
from app.chat.router import router as chat_router
from app.viewers.router import router as viewers_router
from app.analytics.router import router as analytics_router
from app.livekit.router import router as livekit_router
from app.twitch.router import router as twitch_router
from app.websocket.router import router as websocket_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stageside.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing StageSide Cafe API Control Plane...")
    # Initialize DB tables (for quick testing/development)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema initialized.")
    except Exception as e:
        logger.warning(f"Could not initialize DB schema automatically ({e}). Alembic or Postgres running?")

    # Connect to Redis
    await redis_manager.connect()
    yield
    # Teardown
    await redis_manager.close()
    await engine.dispose()
    logger.info("StageSide Cafe API Control Plane shutdown completed.")

app = FastAPI(
    title="StageSide Cafe Control Plane API",
    version="1.0.0",
    description="Control plane for StageSide Cafe: Multi-POV streaming, AI Sentinel moderation, and Cafe communities.",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
api_v1_prefix = "/api/v1"
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(streams_router, prefix=api_v1_prefix)
app.include_router(cameras_router, prefix=api_v1_prefix)
app.include_router(sentinel_router, prefix=api_v1_prefix)
app.include_router(communities_router, prefix=api_v1_prefix)
app.include_router(chat_router, prefix=api_v1_prefix)
app.include_router(viewers_router, prefix=api_v1_prefix)
app.include_router(analytics_router, prefix=api_v1_prefix)
app.include_router(livekit_router, prefix=api_v1_prefix)
app.include_router(twitch_router, prefix=api_v1_prefix)

# WebSocket Router
app.include_router(websocket_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "stageside-api",
        "env": settings.APP_ENV
    }
