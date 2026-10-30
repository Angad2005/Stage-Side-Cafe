from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
from app.database import get_db, Stream, Camera, User, redis_manager
from app.auth.dependencies import get_current_user, require_streamer
from .schemas import CreateStreamRequest, StreamResponse, StreamStatusResponse

router = APIRouter(prefix="/streams", tags=["streams"])

@router.post("", response_model=StreamResponse)
async def create_stream(
    payload: CreateStreamRequest,
    user: User = Depends(require_streamer),
    db: AsyncSession = Depends(get_db)
):
    stream = Stream(
        broadcaster_id=user.id,
        title=payload.title,
        description=payload.description,
        twitch_channel=payload.twitch_channel or user.username,
        max_cameras=payload.max_cameras,
        status="created"
    )
    db.add(stream)
    await db.commit()
    await db.refresh(stream)
    return stream

@router.get("", response_model=List[StreamResponse])
async def list_streams(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Stream).order_by(Stream.created_at.desc()))
    return result.scalars().all()

@router.get("/{stream_id}", response_model=StreamResponse)
async def get_stream(stream_id: str, db: AsyncSession = Depends(get_db)):
    stream = await db.get(Stream, stream_id)
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    return stream

@router.post("/{stream_id}/start", response_model=StreamResponse)
async def start_stream(
    stream_id: str,
    user: User = Depends(require_streamer),
    db: AsyncSession = Depends(get_db)
):
    stream = await db.get(Stream, stream_id)
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    stream.status = "live"
    stream.started_at = datetime.utcnow()
    await db.commit()
    await db.refresh(stream)
    
    await redis_manager.set_stream_status(stream_id, "live")
    await redis_manager.publish_event(f"stream:{stream_id}", {
        "event": "stream.started",
        "stream_id": stream_id,
        "title": stream.title,
        "livekit_room": stream.livekit_room_name,
        "timestamp": datetime.utcnow().isoformat()
    })
    return stream

@router.post("/{stream_id}/end", response_model=StreamResponse)
async def end_stream(
    stream_id: str,
    user: User = Depends(require_streamer),
    db: AsyncSession = Depends(get_db)
):
    stream = await db.get(Stream, stream_id)
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    stream.status = "ended"
    stream.ended_at = datetime.utcnow()
    await db.commit()
    await db.refresh(stream)
    
    await redis_manager.set_stream_status(stream_id, "ended")
    await redis_manager.publish_event(f"stream:{stream_id}", {
        "event": "stream.ended",
        "stream_id": stream_id,
        "timestamp": datetime.utcnow().isoformat()
    })
    return stream

@router.get("/{stream_id}/status")
async def get_stream_status(stream_id: str, db: AsyncSession = Depends(get_db)):
    stream = await db.get(Stream, stream_id)
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    cams_res = await db.execute(select(Camera).where(Camera.stream_id == stream_id))
    cameras = cams_res.scalars().all()
    
    cam_data = []
    for c in cameras:
        cam_data.append({
            "id": c.id,
            "label": c.label,
            "name": c.name,
            "status": c.status,
            "moderation_state": c.moderation_state,
            "is_primary": c.is_primary,
            "source_id": c.source_id
        })
    
    return {
        "stream_id": stream.id,
        "title": stream.title,
        "status": stream.status,
        "active_viewers": 1420,
        "cameras": cam_data,
        "sentinel_state": "nominal"
    }

@router.get("/by-channel/{channel_id}/cameras")
async def get_cameras_by_channel(channel_id: str, db: AsyncSession = Depends(get_db)):
    # Used by Twitch Extension
    result = await db.execute(select(Stream).where(Stream.twitch_channel == channel_id, Stream.status == "live"))
    stream = result.scalar_one_or_none()
    if not stream:
        result = await db.execute(select(Stream).order_by(Stream.created_at.desc()).limit(1))
        stream = result.scalar_one_or_none()
        
    if not stream:
        return {"cameras": []}
        
    cams_res = await db.execute(select(Camera).where(Camera.stream_id == stream.id))
    cameras = cams_res.scalars().all()
    return {
        "stream_id": stream.id,
        "cameras": [
            {
                "id": c.id,
                "label": c.label,
                "moderation_state": c.moderation_state,
                "is_primary": c.is_primary,
                "status": c.status
            }
            for c in cameras
        ]
    }
