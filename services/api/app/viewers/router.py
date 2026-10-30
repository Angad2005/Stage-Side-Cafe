from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.database import get_db, ViewerPreference, ViewerCameraPreference, Camera, User, redis_manager
from app.auth.dependencies import get_current_user
from .schemas import SelectCameraRequest, ViewerPreferencesRequest, ViewerPreferencesResponse

router = APIRouter(prefix="/viewers", tags=["viewers"])

@router.post("/select-camera")
async def select_camera(
    payload: SelectCameraRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    camera = await db.get(Camera, payload.camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    if camera.moderation_state != "safe":
        raise HTTPException(status_code=403, detail="Cannot switch to isolated/unsafe camera feed")

    prev_cam = await redis_manager.get_viewer_camera(user.id, payload.stream_id) or "none"
    await redis_manager.set_viewer_camera(user.id, payload.stream_id, payload.camera_id)

    # Record preference
    pref = ViewerCameraPreference(
        user_id=user.id,
        stream_id=payload.stream_id,
        camera_id=payload.camera_id,
        selected_at=datetime.utcnow()
    )
    db.add(pref)
    await db.commit()

    await redis_manager.publish_event(f"stream:{payload.stream_id}", {
        "event": "viewer.pov_changed",
        "stream_id": payload.stream_id,
        "user_id": user.id,
        "previous_camera_id": prev_cam,
        "new_camera_id": payload.camera_id,
        "timestamp": datetime.utcnow().isoformat()
    })

    return {"status": "success", "selected_camera_id": payload.camera_id}

@router.get("/preferences", response_model=ViewerPreferencesResponse)
async def get_preferences(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(ViewerPreference).where(ViewerPreference.user_id == user.id))
    pref = res.scalar_one_or_none()
    if not pref:
        return ViewerPreferencesResponse(
            interests=["Competitive Gaming", "Esports Analysis"],
            preferred_community_size=4
        )
    return ViewerPreferencesResponse(
        interests=pref.interests or [],
        preferred_community_size=pref.preferred_community_size
    )

@router.put("/preferences", response_model=ViewerPreferencesResponse)
async def update_preferences(
    payload: ViewerPreferencesRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(ViewerPreference).where(ViewerPreference.user_id == user.id))
    pref = res.scalar_one_or_none()
    if not pref:
        pref = ViewerPreference(
            user_id=user.id,
            interests=payload.interests,
            preferred_community_size=payload.preferred_community_size
        )
        db.add(pref)
    else:
        pref.interests = payload.interests
        pref.preferred_community_size = payload.preferred_community_size
    await db.commit()
    return ViewerPreferencesResponse(
        interests=pref.interests,
        preferred_community_size=pref.preferred_community_size
    )
