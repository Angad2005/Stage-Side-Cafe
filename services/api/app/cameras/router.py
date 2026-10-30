from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
from app.database import get_db, Camera, Stream, User, redis_manager
from app.auth.dependencies import get_current_user, require_streamer
from .schemas import RegisterCameraRequest, UpdateCameraRequest, CameraResponse

router = APIRouter(tags=["cameras"])

@router.post("/streams/{stream_id}/cameras", response_model=CameraResponse)
async def register_camera(
    stream_id: str,
    payload: RegisterCameraRequest,
    user: User = Depends(require_streamer),
    db: AsyncSession = Depends(get_db)
):
    stream = await db.get(Stream, stream_id)
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
        
    camera = Camera(
        stream_id=stream_id,
        name=payload.name,
        label=payload.label,
        source_id=payload.source_id,
        is_primary=payload.is_primary,
        sort_order=payload.sort_order,
        fallback_image_url=payload.fallback_image_url,
        status="offline",
        moderation_state="safe"
    )
    db.add(camera)
    await db.commit()
    await db.refresh(camera)
    return camera

@router.get("/streams/{stream_id}/cameras", response_model=List[CameraResponse])
async def list_cameras(stream_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Camera).where(Camera.stream_id == stream_id).order_by(Camera.sort_order.asc())
    )
    return result.scalars().all()

@router.get("/cameras/{camera_id}", response_model=CameraResponse)
async def get_camera(camera_id: str, db: AsyncSession = Depends(get_db)):
    camera = await db.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera

@router.put("/cameras/{camera_id}", response_model=CameraResponse)
async def update_camera(
    camera_id: str,
    payload: UpdateCameraRequest,
    user: User = Depends(require_streamer),
    db: AsyncSession = Depends(get_db)
):
    camera = await db.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(camera, k, v)
        
    await db.commit()
    await db.refresh(camera)
    return camera

@router.post("/cameras/{camera_id}/restore", response_model=CameraResponse)
async def restore_camera(
    camera_id: str,
    user: User = Depends(require_streamer),
    db: AsyncSession = Depends(get_db)
):
    """
    Explicit streamer approval required to restore a blocked or isolated camera feed.
    No camera is ever unblocked automatically by next frames looking safe.
    """
    camera = await db.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    camera.status = "online"
    camera.moderation_state = "safe"
    await db.commit()
    await db.refresh(camera)

    await redis_manager.set_camera_status(camera_id, "online", "safe")
    await redis_manager.publish_event(f"stream:{camera.stream_id}", {
        "event": "camera.restored",
        "stream_id": camera.stream_id,
        "camera_id": camera_id,
        "restored_by": user.id,
        "timestamp": datetime.utcnow().isoformat()
    })
    return camera

@router.delete("/cameras/{camera_id}")
async def delete_camera(
    camera_id: str,
    user: User = Depends(require_streamer),
    db: AsyncSession = Depends(get_db)
):
    camera = await db.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    await db.delete(camera)
    await db.commit()
    return {"status": "success", "message": "Camera removed"}
