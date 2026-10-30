from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class IncidentResponse(BaseModel):
    id: str
    camera_id: str
    camera_label: Optional[str] = None
    stream_id: str
    category: str
    subcategory: Optional[str] = None
    confidence: float
    action: str
    model_id: str
    details: Dict[str, Any]
    frame_timestamp: float
    resolved: bool
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"protected_namespaces": (), "from_attributes": True}

class PolicyUpdateItem(BaseModel):
    category: str
    enabled: bool = True
    hold_threshold: float = Field(default=0.5, ge=0.0, le=1.0)
    block_threshold: float = Field(default=0.8, ge=0.0, le=1.0)
    auto_restore: bool = False

class PolicyListRequest(BaseModel):
    policies: List[PolicyUpdateItem]

class EmergencyLockRequest(BaseModel):
    reason: Optional[str] = "Manual streamer emergency panic cut"
