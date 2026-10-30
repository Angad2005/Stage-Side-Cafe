from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class CreateStreamRequest(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    twitch_channel: Optional[str] = None
    max_cameras: int = Field(default=6, ge=1, le=12)

class StreamResponse(BaseModel):
    id: str
    broadcaster_id: str
    title: str
    description: Optional[str]
    status: str
    stream_key: str
    livekit_room_name: str
    twitch_channel: Optional[str]
    max_cameras: int
    created_at: datetime
    started_at: Optional[datetime]
    ended_at: Optional[datetime]

    class Config:
        from_attributes = True

class StreamStatusResponse(BaseModel):
    stream: StreamResponse
    active_viewers: int
    cameras: List[dict]
    sentinel_state: str
