import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine, redis_manager
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
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema initialized.")
    except Exception as error:
        logger.warning("Could not initialize DB schema automatically (%s). Alembic or Postgres running?", error)

    await redis_manager.connect()
    yield
    await redis_manager.close()
    await engine.dispose()
    logger.info("StageSide Cafe API Control Plane shutdown completed.")


app = FastAPI(
    title="StageSide Cafe Control Plane API",
    version="1.0.0",
    description="Control plane for StageSide Cafe: Multi-POV streaming, AI Sentinel moderation, and Cafe communities.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
app.include_router(websocket_router)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "stageside-api",
        "env": settings.APP_ENV,
    }


web_dist_dir = Path(os.getenv("WEB_DIST_DIR", "/app/web/dist"))
if (web_dist_dir / "index.html").is_file():
    assets_dir = web_dist_dir / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="web-assets")

    @app.get("/{frontend_path:path}", include_in_schema=False)
    async def serve_frontend(frontend_path: str):
        if frontend_path.startswith(("api/", "ws/")):
            raise HTTPException(status_code=404, detail="Not found")

        frontend_root = web_dist_dir.resolve()
        requested_file = (frontend_root / frontend_path).resolve()
        try:
            requested_file.relative_to(frontend_root)
        except ValueError as error:
            raise HTTPException(status_code=404, detail="Not found") from error

        if requested_file.is_file():
            return FileResponse(requested_file)
        return FileResponse(frontend_root / "index.html")
