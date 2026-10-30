import base64
import logging
from typing import List, Optional
import cv2
import numpy as np
from .base import BaseDetector, Detection

logger = logging.getLogger("sentinel.openai")

class OpenAIModerator(BaseDetector):
    """
    Uses OpenAI's omni-moderation-latest model for supplemental cloud safety screening.
    Note: Supplementary classifier, not the only safety barrier.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        self._client = None

    async def initialize(self) -> None:
        if self.api_key:
            try:
                from openai import AsyncOpenAI
                self._client = AsyncOpenAI(api_key=self.api_key)
                logger.info("OpenAIModerator initialized with API key")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")

    async def detect(self, frame: np.ndarray) -> List[Detection]:
        if not self._client:
            return []

        try:
            # Resize frame to max 512px for low latency API call
            h, w = frame.shape[:2]
            scale = min(512.0 / max(h, w), 1.0)
            resized = cv2.resize(frame, (int(w * scale), int(h * scale)))
            _, buffer = cv2.imencode('.jpg', resized, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            b64_image = base64.b64encode(buffer).decode('utf-8')

            # Call omni-moderation-latest API
            response = await self._client.moderations.create(
                model="omni-moderation-latest",
                input=[
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_image}"}}
                ]
            )

            detections: List[Detection] = []
            results = response.results[0]
            if results.flagged:
                for cat, score in results.category_scores.model_dump().items():
                    if score > 0.6:
                        detections.append(Detection(
                            category="openai_flagged",
                            subcategory=cat,
                            confidence=score,
                            description=f"OpenAI omni-moderation flagged: {cat}",
                            model_id="omni-moderation-latest"
                        ))
            return detections
        except Exception as e:
            logger.warning(f"OpenAI moderation API call skipped/failed: {e}")
            return []

    @property
    def name(self) -> str:
        return "openai_omni_moderator"

    @property
    def categories(self) -> List[str]:
        return ["visual_safety", "violence", "hate", "harassment", "self-harm"]
