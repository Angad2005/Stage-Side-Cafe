from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class JoinCommunityRequest(BaseModel):
    stream_id: str
    interests: List[str] = Field(default_factory=list)
    preferred_size: int = Field(default=4, ge=3, le=6)

class CommunityMemberResponse(BaseModel):
    user_id: str
    username: str
    avatar_url: Optional[str]
    joined_at: datetime

    class Config:
        from_attributes = True

class CommunityResponse(BaseModel):
    id: str
    stream_id: str
    name: str
    capacity: int
    member_count: int
    members: List[CommunityMemberResponse] = []
    is_active: bool

    class Config:
        from_attributes = True
