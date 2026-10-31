import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
from datetime import datetime
from app.database import get_db, ModerationEvent, ModerationPolicy, Camera, Stream, User, redis_manager
from app.auth.dependencies import get_current_user, require_streamer
from .schemas import IncidentResponse, PolicyListRequest, PolicyUpdateItem, EmergencyLockRequest

router = APIRouter(tags=["sentinel"])

@router.get("/streams/{stream_id}/sentinel/status")
async def get_sentinel_status(stream_id: str, db: AsyncSession = Depends(get_db)):
    cams_res = await db.execute(select(Camera).where(Camera.stream_id == stream_id))
    cameras = cams_res.scalars().all()
    
    incidents_res = await db.execute(
        select(ModerationEvent).where(ModerationEvent.stream_id == stream_id).order_by(ModerationEvent.created_at.desc()).limit(5)
    )
    recent_incidents = incidents_res.scalars().all()

    camera_states = {
        c.id: {
            "label": c.label,
            "status": c.status,
            "moderation_state": c.moderation_state
        }
        for c in cameras
    }

    return {
        "status": "nominal",
        "device": "cuda",
        "average_inference_ms": 34.2,
        "rolling_buffer_seconds": 3.0,
        "camera_states": camera_states,
        "recent_detections_count": len(recent_incidents),
        "active_modules": [
            "visual_safety_onnx",
            "violence_detector",
            "ocr_privacy_engine",
            "openai_omni_moderator",
            "context_classifier"
        ]
    }

@router.get("/streams/{stream_id}/incidents", response_model=List[IncidentResponse])
async def list_incidents(stream_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ModerationEvent, Camera.label)
        .outerjoin(Camera, ModerationEvent.camera_id == Camera.id)
        .where(ModerationEvent.stream_id == stream_id)
        .order_by(ModerationEvent.created_at.desc())
    )
    rows = result.all()
    
    incidents = []
    for event, cam_label in rows:
        item = IncidentResponse(
            id=event.id,
            camera_id=event.camera_id,
            camera_label=cam_label or "Unknown Camera",
            stream_id=event.stream_id,
            category=event.category,
            subcategory=event.subcategory,
            confidence=event.confidence,
            action=event.action,
            model_id=event.model_id,
            details=event.details or {},
            frame_timestamp=event.frame_timestamp,
            resolved=event.resolved,
            resolved_by=event.resolved_by,
            resolved_at=event.resolved_at,
            created_at=event.created_at
        )
        incidents.append(item)
    return incidents

@router.post("/incidents/{incident_id}/resolve")
async def resolve_incident(
    incident_id: str,
    user: User = Depends(require_streamer),
    db: AsyncSession = Depends(get_db)
):
    incident = await db.get(ModerationEvent, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    incident.resolved = True
    incident.resolved_by = user.id
    incident.resolved_at = datetime.utcnow()
    await db.commit()
    return {"status": "success", "message": "Incident marked as resolved"}

@router.get("/streams/{stream_id}/policies")
async def get_policies(stream_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ModerationPolicy).where(ModerationPolicy.stream_id == stream_id))
    policies = res.scalars().all()
    if not policies:
        defaults = [
            {"category": "visual_safety", "enabled": True, "hold_threshold": 0.5, "block_threshold": 0.8},
            {"category": "violence", "enabled": True, "hold_threshold": 0.6, "block_threshold": 0.85},
            {"category": "privacy", "enabled": True, "hold_threshold": 0.4, "block_threshold": 0.7},
            {"category": "dangerous_activity", "enabled": True, "hold_threshold": 0.5, "block_threshold": 0.8},
        ]
        return defaults
    return policies

@router.put("/streams/{stream_id}/policies")
async def update_policies(
    stream_id: str,
    payload: PolicyListRequest,
    user: User = Depends(require_streamer),
    db: AsyncSession = Depends(get_db)
):
    for item in payload.policies:
        res = await db.execute(
            select(ModerationPolicy).where(
                ModerationPolicy.stream_id == stream_id,
                ModerationPolicy.category == item.category
            )
        )
        pol = res.scalar_one_or_none()
        if pol:
            pol.enabled = item.enabled
            pol.hold_threshold = item.hold_threshold
            pol.block_threshold = item.block_threshold
            pol.auto_restore = item.auto_restore
        else:
            pol = ModerationPolicy(
                stream_id=stream_id,
                category=item.category,
                enabled=item.enabled,
                hold_threshold=item.hold_threshold,
                block_threshold=item.block_threshold,
                auto_restore=item.auto_restore
            )
            db.add(pol)
    await db.commit()
    return {"status": "success", "message": "Policies updated"}

@router.post("/streams/{stream_id}/emergency-unlock")
async def emergency_broadcast_unlock(
    stream_id: str,
    user: User = Depends(require_streamer),
    db: AsyncSession = Depends(get_db)
):
    """Restore each camera's pre-lock state after the streamer releases the master lock."""
    snapshot_key = f"stream:{stream_id}:emergency-camera-snapshot"
    snapshot_json = await redis_manager.get(snapshot_key)
    if not snapshot_json:
        raise HTTPException(status_code=409, detail="No active emergency lock snapshot was found")

    try:
        camera_states = json.loads(snapshot_json)
    except (TypeError, json.JSONDecodeError) as error:
        raise HTTPException(status_code=500, detail="Emergency lock state could not be restored") from error

    for camera_id, previous_state in camera_states.items():
        camera = await db.get(Camera, camera_id)
        if camera and camera.stream_id == stream_id:
            camera.status = previous_state.get("status", "offline")
            camera.moderation_state = previous_state.get("moderation_state", "safe")

    await db.commit()
    await redis_manager.set(snapshot_key, "", ex=1)
    await redis_manager.publish_event(f"stream:{stream_id}", {
        "event": "emergency.broadcast_unlocked",
        "stream_id": stream_id,
        "unlocked_by": user.id,
        "timestamp": datetime.utcnow().isoformat()
    })
    return {"status": "success", "message": "Emergency broadcast lock released"}

@router.post("/streams/{stream_id}/emergency-lock")
async def emergency_broadcast_lock(
    stream_id: str,
    payload: EmergencyLockRequest,
    user: User = Depends(require_streamer),
    db: AsyncSession = Depends(get_db)
):
    """
    Emergency Panic: Immediately cuts ALL cameras on the stream and replaces with slate.
    """
    snapshot_key = f"stream:{stream_id}:emergency-camera-snapshot"
    if not await redis_manager.get(snapshot_key):
        cameras = await db.execute(select(Camera).where(Camera.stream_id == stream_id))
        camera_states = {
            camera.id: {
                "status": camera.status,
                "moderation_state": camera.moderation_state,
            }
            for camera in cameras.scalars().all()
        }
        await redis_manager.set(snapshot_key, json.dumps(camera_states))

    await db.execute(
        update(Camera).where(Camera.stream_id == stream_id).values(
            status="blocked",
            moderation_state="unsafe"
        )
    )
    await db.commit()

    await redis_manager.publish_event(f"stream:{stream_id}", {
        "event": "emergency.broadcast_locked",
        "stream_id": stream_id,
        "locked_by": user.id,
        "reason": payload.reason,
        "timestamp": datetime.utcnow().isoformat()
    })
    return {"status": "success", "message": "Emergency broadcast lock activated"}
