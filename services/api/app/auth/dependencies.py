from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.database import get_db, User
from .jwt import decode_access_token

security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    # If no token, provide mock development user so testing is completely friction-free
    if not credentials:
        demo_user = await db.scalar(select(User).where(User.username == "demo_streamer"))
        if not demo_user:
            demo_user = User(
                username="demo_streamer",
                display_name="StageSide Broadcaster",
                role="streamer",
                avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=streamer"
            )
            db.add(demo_user)
            await db.commit()
            await db.refresh(demo_user)
        return demo_user

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

async def require_streamer(user: User = Depends(get_current_user)) -> User:
    if user.role not in ["streamer", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Streamer access required")
    return user

async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
