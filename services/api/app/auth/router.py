from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db, User, TwitchAccount
from app.config import settings
from .jwt import create_access_token
from .dependencies import get_current_user
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/twitch/login")
async def twitch_login():
    """Generates Twitch OAuth authorization URL."""
    auth_url = (
        f"https://id.twitch.tv/oauth2/authorize"
        f"?client_id={settings.TWITCH_CLIENT_ID}"
        f"&redirect_uri={settings.TWITCH_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=user:read:email+channel:read:subscriptions+chat:read+chat:edit"
    )
    return {"login_url": auth_url}

@router.get("/twitch/callback")
async def twitch_callback(code: str = Query(...), db: AsyncSession = Depends(get_db)):
    """Simulates/Completes Twitch OAuth authorization code grant."""
    twitch_user_id = f"tw_{uuid.uuid4().hex[:8]}"
    username = f"twitch_user_{uuid.uuid4().hex[:4]}"

    user = await db.scalar(select(User).where(User.username == username))
    if not user:
        user = User(
            username=username,
            display_name=username.replace("_", " ").title(),
            avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={username}",
            role="streamer"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token({"sub": user.id, "username": user.username, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "role": user.role,
            "avatar_url": user.avatar_url
        }
    }

@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "role": user.role,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat()
    }

@router.post("/logout")
async def logout():
    return {"status": "success", "message": "Logged out successfully"}
