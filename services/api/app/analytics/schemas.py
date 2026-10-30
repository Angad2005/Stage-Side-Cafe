from pydantic import BaseModel
from typing import List

class CameraPopularityItem(BaseModel):
    camera_id: str
    label: str
    viewer_count: int
    percentage: float

class AnalyticsResponse(BaseModel):
    stream_id: str
    viewer_count: int
    peak_viewers: int
    pov_switches: int
    camera_popularity: List[CameraPopularityItem]
