from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
from app.database import get_db, ChatMessage, Community, User, redis_manager
from app.auth.dependencies import get_current_user
from .schemas import SendMessageRequest, ChatMessageResponse

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/messages", response_model=ChatMessageResponse)
async def send_message(
    payload: SendMessageRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    msg = ChatMessage(
        community_id=payload.community_id,
        user_id=user.id,
        message=payload.message,
        message_type=payload.message_type
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    # Publish to Redis channel for live delivery
    comm = await db.get(Community, payload.community_id)
    stream_id = comm.stream_id if comm else "unknown"

    await redis_manager.publish_event(f"stream:{stream_id}", {
        "event": "community.message",
        "stream_id": stream_id,
        "community_id": payload.community_id,
        "message_id": msg.id,
        "user_id": user.id,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "message": msg.message,
        "message_type": msg.message_type,
        "timestamp": msg.created_at.isoformat()
    })

    return ChatMessageResponse(
        id=msg.id,
        community_id=msg.community_id,
        user_id=user.id,
        username=user.username,
        avatar_url=user.avatar_url,
        message=msg.message,
        message_type=msg.message_type,
        created_at=msg.created_at
    )

@router.get("/communities/{community_id}/messages", response_model=List[ChatMessageResponse])
async def get_messages(community_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatMessage, User)
        .join(User, ChatMessage.user_id == User.id)
        .where(ChatMessage.community_id == community_id, ChatMessage.is_deleted == False)
        .order_by(ChatMessage.created_at.asc())
        .limit(100)
    )
    messages = []
    for m, u in result.all():
        messages.append(ChatMessageResponse(
            id=m.id,
            community_id=m.community_id,
            user_id=u.id,
            username=u.username,
            avatar_url=u.avatar_url,
            message=m.message,
            message_type=m.message_type,
            created_at=m.created_at
        ))
    return messages
