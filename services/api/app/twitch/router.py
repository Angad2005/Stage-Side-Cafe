from fastapi import APIRouter, Request, Header, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.database import redis_manager
from .service import twitch_service

router = APIRouter(prefix="/twitch", tags=["twitch"])

class ExtensionConfigUpdate(BaseModel):
    cameras: Optional[List[Dict[str, Any]]] = None
    policies: Optional[List[Dict[str, Any]]] = None

@router.post("/eventsub")
async def eventsub_webhook(
    request: Request,
    twitch_eventsub_message_type: Optional[str] = Header(None, alias="Twitch-Eventsub-Message-Type"),
    twitch_eventsub_message_id: Optional[str] = Header(None, alias="Twitch-Eventsub-Message-Id"),
    twitch_eventsub_message_timestamp: Optional[str] = Header(None, alias="Twitch-Eventsub-Message-Timestamp"),
    twitch_eventsub_message_signature: Optional[str] = Header(None, alias="Twitch-Eventsub-Message-Signature"),
):
    body = await request.body()
    data = await request.json()

    # Challenge verification for webhook setup
    if twitch_eventsub_message_type == "webhook_callback_verification":
        return data.get("challenge")

    # Broadcast event to redis
    event_type = data.get("subscription", {}).get("type", "unknown")
    await redis_manager.publish_event("twitch:events", {
        "event": f"twitch.{event_type}",
        "data": data.get("event", {})
    })

    return {"status": "ok"}

@router.get("/extension/config")
async def get_extension_config():
    return {
        "cameras": [
            {"id": "cam_1", "name": "camera_host", "label": "Host POV", "sourceId": "obs_host", "isPrimary": True, "sortOrder": 0},
            {"id": "cam_2", "name": "camera_guest", "label": "Guest POV", "sourceId": "obs_guest", "isPrimary": False, "sortOrder": 1},
            {"id": "cam_3", "name": "camera_gameplay", "label": "Gameplay POV", "sourceId": "obs_gameplay", "isPrimary": False, "sortOrder": 2},
        ],
        "policies": [
            {"category": "visual_safety", "enabled": True, "holdThreshold": 0.5, "blockThreshold": 0.8},
            {"category": "violence", "enabled": True, "holdThreshold": 0.6, "blockThreshold": 0.85},
            {"category": "privacy", "enabled": True, "holdThreshold": 0.4, "blockThreshold": 0.7},
            {"category": "dangerous_activity", "enabled": True, "holdThreshold": 0.5, "blockThreshold": 0.8},
        ]
    }

@router.put("/extension/config")
async def update_extension_config(payload: ExtensionConfigUpdate):
    return {"status": "success", "message": "Extension configuration updated"}
