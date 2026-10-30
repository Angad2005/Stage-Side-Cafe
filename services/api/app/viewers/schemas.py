from pydantic import BaseModel, Field
from typing import List, Optional

class SelectCameraRequest(BaseModel):
    stream_id: str
    camera_id: str

class ViewerPreferencesRequest(BaseModel):
    interests: List[str] = Field(default_factory=list)
    preferred_community_size: int = Field(default=4, ge=3, le=6)

class ViewerPreferencesResponse(BaseModel):
    interests: List[str]
    preferred_community_size: int
