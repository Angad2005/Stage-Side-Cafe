import time
import os
import sys
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# Ensure current directory is in sys.path for direct execution
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from .sentinel import ai_sentinel
    from .preprocessing import FrameProcessor
    from .policies import ModerationAction
except (ImportError, ValueError):
    from sentinel import ai_sentinel
    from preprocessing import FrameProcessor
    from policies import ModerationAction

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sentinel.api")

app = FastAPI(
    title="AI Sentinel Moderation Engine",
    version="1.0.0",
    description="Real-time in-line visual and privacy moderation service for StageSide Cafe."
)

class AnalyzeFrameRequest(BaseModel):
    stream_id: str
    camera_id: str
    timestamp: float
    frame_b64: str  # Base64 encoded JPEG

class AnalyzeFrameResponse(BaseModel):
    camera_id: str
    timestamp: float
    action: str  # allow, hold, block, fail_closed
    category: Optional[str] = None
    confidence: float
    reason: str
    detections: List[Dict[str, Any]] = []

@app.on_event("startup")
async def startup_event():
    await ai_sentinel.initialize()

@app.post("/analyze", response_model=AnalyzeFrameResponse)
async def analyze_frame(payload: AnalyzeFrameRequest):
    try:
        frame = FrameProcessor.decode_jpeg_b64(payload.frame_b64)
        if frame is None or frame.size == 0:
            raise HTTPException(status_code=400, detail="Invalid image payload")

        decision = await ai_sentinel.analyze_frame(
            stream_id=payload.stream_id,
            camera_id=payload.camera_id,
            frame=frame,
            timestamp=payload.timestamp
        )

        detections_data = [
            {
                "category": d.category,
                "subcategory": d.subcategory,
                "confidence": d.confidence,
                "description": d.description,
                "model_id": d.model_id
            }
            for d in (decision.detections or [])
        ]

        return AnalyzeFrameResponse(
            camera_id=decision.camera_id,
            timestamp=decision.timestamp,
            action=decision.action.value,
            category=decision.category,
            confidence=decision.confidence,
            reason=decision.reason,
            detections=detections_data
        )
    except Exception as e:
        logger.error(f"Moderation failure on camera {payload.camera_id}: {e}")
        # FAIL-CLOSED ARCHITECTURE: Never release unverified frames if analysis crashes!
        return AnalyzeFrameResponse(
            camera_id=payload.camera_id,
            timestamp=payload.timestamp,
            action=ModerationAction.FAIL_CLOSED.value,
            category="system_error",
            confidence=1.0,
            reason=f"Fail-closed safe guard triggered: {str(e)}",
            detections=[]
        )

@app.get("/status")
async def get_status():
    return {
        "status": "active",
        "detectors": [d.name for d in ai_sentinel.detectors],
        "device": "cpu"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
