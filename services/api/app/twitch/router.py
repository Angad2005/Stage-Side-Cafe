from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import TwitchAccount, User, get_db, redis_manager
from .service import twitch_service

router = APIRouter(prefix="/twitch", tags=["twitch"])


class ExtensionConfigUpdate(BaseModel):
    cameras: Optional[List[Dict[str, Any]]] = None
    policies: Optional[List[Dict[str, Any]]] = None


@router.get("/account")
async def get_twitch_account_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the connected Twitch identity and the channel's current live status."""
    account = await db.scalar(
        select(TwitchAccount).where(TwitchAccount.user_id == user.id)
    )
    if not account:
        return {"connected": False, "account": None, "stream": None}

    try:
        access_token = await twitch_service.get_valid_access_token(account, db)
        stream = await twitch_service.get_stream(access_token, account.twitch_user_id)
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
        ) from error
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Twitch could not be reached. Try refreshing the channel status.",
        ) from error

    return {
        "connected": True,
        "account": {
            "id": account.twitch_user_id,
            "login": account.twitch_username,
            "displayName": user.display_name,
            "profileImageUrl": user.avatar_url,
            "channelUrl": f"https://www.twitch.tv/{account.twitch_username}",
        },
        "stream": {
            "isLive": stream is not None,
            "title": stream.get("title") if stream else None,
            "gameName": stream.get("game_name") if stream else None,
            "viewerCount": stream.get("viewer_count") if stream else 0,
            "startedAt": stream.get("started_at") if stream else None,
            "language": stream.get("language") if stream else None,
        },
    }


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
