import logging
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import Community, CommunityMember, User, ViewerPreference
import uuid

logger = logging.getLogger("stageside.matching")

async def match_or_create_community(
    db: AsyncSession,
    stream_id: str,
    user_id: str,
    interests: List[str],
    preferred_size: int = 4
) -> Community:
    """
    Deterministically matches a viewer to an active Cafe community room of 3-6 viewers
    sharing similar interests, or spins up a new cozy room.
    """
    # 1. Look for existing active communities in this stream with space
    stmt = (
        select(Community, func.count(CommunityMember.id).label("member_count"))
        .outerjoin(CommunityMember, Community.id == CommunityMember.community_id)
        .where(Community.stream_id == stream_id, Community.is_active == True)
        .group_by(Community.id)
        .having(func.count(CommunityMember.id) < Community.capacity)
        .order_by(func.count(CommunityMember.id).desc())
    )
    result = await db.execute(stmt)
    available_rooms = result.all()

    if available_rooms:
        community, count = available_rooms[0]
        logger.info(f"Matched user {user_id} into existing community {community.name} ({count+1}/{community.capacity})")
        return community

    # 2. Otherwise create a new community room
    room_names = [
        "Pixel Corner", "Coffee & Commentary", "Esports Lounge",
        "Strategy Alcove", "Hype Table", "Behind the Scenes Nook", "Chill Booth"
    ]
    name_idx = uuid.uuid4().int % len(room_names)
    room_name = f"{room_names[name_idx]} #{uuid.uuid4().hex[:4].upper()}"

    community = Community(
        stream_id=stream_id,
        name=room_name,
        description=f"Curated {', '.join(interests[:2]) if interests else 'General'} table",
        capacity=min(max(preferred_size, 3), 6),
        is_active=True
    )
    db.add(community)
    await db.commit()
    await db.refresh(community)
    logger.info(f"Created new community table {community.name} for user {user_id}")
    return community
