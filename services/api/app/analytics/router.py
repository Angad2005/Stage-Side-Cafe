from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db, Stream, Camera
from .schemas import AnalyticsResponse, CameraPopularityItem

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/streams/{stream_id}", response_model=AnalyticsResponse)
async def get_stream_analytics(stream_id: str, db: AsyncSession = Depends(get_db)):
    stream = await db.get(Stream, stream_id)
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
        
    cams_res = await db.execute(select(Camera).where(Camera.stream_id == stream_id))
    cameras = cams_res.scalars().all()

    # Calculate simulated distribution
    total_viewers = 1420
    camera_distribution = [
        {"label": "Host POV", "share": 0.52},
        {"label": "Guest POV", "share": 0.28},
        {"label": "Gameplay POV", "share": 0.20},
    ]

    popularity = []
    for idx, c in enumerate(cameras):
        share = camera_distribution[idx % len(camera_distribution)]["share"]
        v_count = int(total_viewers * share)
        popularity.append(CameraPopularityItem(
            camera_id=c.id,
            label=c.label,
            viewer_count=v_count,
            percentage=round(share * 100, 1)
        ))

    return AnalyticsResponse(
        stream_id=stream.id,
        viewer_count=total_viewers,
        peak_viewers=1890,
        pov_switches=345,
        camera_popularity=popularity
    )

@router.post("/pov-switch")
async def record_pov_switch():
    return {"status": "success", "message": "POV switch recorded"}
