from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.auth.dependencies import get_current_user
from app.database import User
from app.config import settings
from .service import livekit_service

router = APIRouter(prefix="/livekit", tags=["livekit"])

class TokenRequest(BaseModel):
    stream_id: str
    room_name: str

@router.post("/token")
async def get_viewer_token(
    payload: TokenRequest,
    user: User = Depends(get_current_user)
):
    token = livekit_service.generate_viewer_token(
        room_name=payload.room_name,
        participant_identity=user.id,
        participant_name=user.display_name
    )
    return {
        "token": token,
        "room_name": payload.room_name,
        "participant_identity": user.id,
        "ws_url": settings.LIVEKIT_URL
    }

@router.post("/publisher-token")
async def get_publisher_token(payload: TokenRequest):
    token = livekit_service.generate_publisher_token(
        room_name=payload.room_name,
        camera_identity=f"gateway_{payload.stream_id}"
    )
    return {
        "token": token,
        "room_name": payload.room_name,
        "ws_url": settings.LIVEKIT_URL
    }
