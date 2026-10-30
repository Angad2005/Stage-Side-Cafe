from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from datetime import datetime
from app.database import get_db, Community, CommunityMember, User, redis_manager
from app.auth.dependencies import get_current_user
from .schemas import JoinCommunityRequest, CommunityResponse, CommunityMemberResponse
from .matching import match_or_create_community

router = APIRouter(prefix="/communities", tags=["communities"])

@router.post("/join", response_model=CommunityResponse)
async def join_community(
    payload: JoinCommunityRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Leave any previous room in this stream
    existing_memberships = await db.execute(
        select(CommunityMember)
        .join(Community, CommunityMember.community_id == Community.id)
        .where(Community.stream_id == payload.stream_id, CommunityMember.user_id == user.id)
    )
    for m in existing_memberships.scalars().all():
        await db.delete(m)
    await db.commit()

    # Match or create room
    community = await match_or_create_community(
        db=db,
        stream_id=payload.stream_id,
        user_id=user.id,
        interests=payload.interests,
        preferred_size=payload.preferred_size
    )

    # Add member
    member = CommunityMember(
        community_id=community.id,
        user_id=user.id,
        joined_at=datetime.utcnow()
    )
    db.add(member)
    await db.commit()

    # Fetch updated members
    m_res = await db.execute(
        select(CommunityMember, User)
        .join(User, CommunityMember.user_id == User.id)
        .where(CommunityMember.community_id == community.id)
    )
    members_data = []
    for cm, u in m_res.all():
        members_data.append(CommunityMemberResponse(
            user_id=u.id,
            username=u.username,
            avatar_url=u.avatar_url,
            joined_at=cm.joined_at
        ))

    await redis_manager.publish_event(f"stream:{payload.stream_id}", {
        "event": "community.viewer_joined",
        "stream_id": payload.stream_id,
        "community_id": community.id,
        "user_id": user.id,
        "username": user.username,
        "current_size": len(members_data),
        "timestamp": datetime.utcnow().isoformat()
    })

    return CommunityResponse(
        id=community.id,
        stream_id=community.stream_id,
        name=community.name,
        capacity=community.capacity,
        member_count=len(members_data),
        members=members_data,
        is_active=community.is_active
    )

@router.post("/leave")
async def leave_community(
    community_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(CommunityMember).where(
            and_(CommunityMember.community_id == community_id, CommunityMember.user_id == user.id)
        )
    )
    member = res.scalar_one_or_none()
    if member:
        await db.delete(member)
        await db.commit()
    return {"status": "success", "message": "Left community"}

@router.get("/streams/{stream_id}", response_model=List[CommunityResponse])
async def list_stream_communities(stream_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Community).where(Community.stream_id == stream_id))
    communities = res.scalars().all()
    results = []
    for c in communities:
        m_res = await db.execute(
            select(CommunityMember, User)
            .join(User, CommunityMember.user_id == User.id)
            .where(CommunityMember.community_id == c.id)
        )
        members_data = [
            CommunityMemberResponse(
                user_id=u.id,
                username=u.username,
                avatar_url=u.avatar_url,
                joined_at=cm.joined_at
            )
            for cm, u in m_res.all()
        ]
        results.append(CommunityResponse(
            id=c.id,
            stream_id=c.stream_id,
            name=c.name,
            capacity=c.capacity,
            member_count=len(members_data),
            members=members_data,
            is_active=c.is_active
        ))
    return results
