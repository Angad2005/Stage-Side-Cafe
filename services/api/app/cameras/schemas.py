from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class RegisterCameraRequest(BaseModel):
    name: str = Field(..., max_length=100)
    label: str = Field(..., max_length=100)
    source_id: str = Field(..., max_length=100)
    is_primary: bool = False
    sort_order: int = 0
    fallback_image_url: Optional[str] = None

class UpdateCameraRequest(BaseModel):
    name: Optional[str] = None
    label: Optional[str] = None
    is_primary: Optional[bool] = None
    sort_order: Optional[int] = None
    fallback_image_url: Optional[str] = None

class CameraResponse(BaseModel):
    id: str
    stream_id: str
    name: str
    label: str
    source_id: str
    rtmp_key: str
    status: str
    moderation_state: str
    is_primary: bool
    sort_order: int
    fallback_image_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
