from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SendMessageRequest(BaseModel):
    community_id: str
    message: str = Field(..., min_length=1, max_length=1000)
    message_type: str = "text"  # text, reaction, system

class ChatMessageResponse(BaseModel):
    id: str
    community_id: str
    user_id: str
    username: str
    avatar_url: Optional[str]
    message: str
    message_type: str
    created_at: datetime

    class Config:
        from_attributes = True
