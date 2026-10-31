import time
import os
import sys
import logging
from typing import List, Tuple, Dict, Any, Optional
import numpy as np

# Ensure current directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from .config import config
    from .detectors import (
        BaseDetector, Detection, VisualSafetyDetector, ViolenceDetector,
        OCRPrivacyDetector, OpenAIModerator, ContextClassifier
    )
    from .policies import PolicyEngine, ModerationDecision, ModerationAction
    from .preprocessing import FrameProcessor
except (ImportError, ValueError):
    from config import config
    from detectors import (
        BaseDetector, Detection, VisualSafetyDetector, ViolenceDetector,
        OCRPrivacyDetector, OpenAIModerator, ContextClassifier
    )
    from policies import PolicyEngine, ModerationDecision, ModerationAction
    from preprocessing import FrameProcessor

logger = logging.getLogger("sentinel.core")

class AISentinel:
    """
    AI Sentinel - The core video content screening engine for StageSide Cafe.
    
    Runs sampled rolling-buffer frames through local ONNX computer vision models,
    OCR privacy detectors, and supplemental cloud classifiers.
    Applies deterministic policy rules to protect viewers before broadcast distribution.
    """

    def __init__(self):
        self.detectors: List[BaseDetector] = []
        self.policy_engine = PolicyEngine()
        self.frame_processor = FrameProcessor()
        self.initialized = False

    async def initialize(self):
        if self.initialized:
            return

        # 1. Local Visual Safety Model (Nudity/Sexuality)
        vis_det = VisualSafetyDetector(device=config.INFERENCE_DEVICE)
        await vis_det.initialize()
        self.detectors.append(vis_det)

        # 2. Local Violence & Weapons Model
        vio_det = ViolenceDetector(device=config.INFERENCE_DEVICE)
        await vio_det.initialize()
        self.detectors.append(vio_det)

        # 3. OCR and Privacy Engine (Credentials, Phone numbers)
        ocr_det = OCRPrivacyDetector()
        await ocr_det.initialize()
        self.detectors.append(ocr_det)

        # 4. OpenAI Omni-Moderation (Supplementary cloud verification)
        if config.OPENAI_API_KEY:
            openai_det = OpenAIModerator(api_key=config.OPENAI_API_KEY)
            await openai_det.initialize()
            self.detectors.append(openai_det)

        # 5. Context Classifier (Esports/Gaming context protector)
        ctx_det = ContextClassifier()
        await ctx_det.initialize()
        self.detectors.append(ctx_det)

        self.initialized = True
        logger.info(f"AI Sentinel initialized with {len(self.detectors)} detection modules.")

    async def analyze_frame(
        self,
        stream_id: str,
        camera_id: str,
        frame: np.ndarray,
        timestamp: float
    ) -> ModerationDecision:
        if not self.initialized:
            await self.initialize()

        # Preprocess: scale to standard analysis resolution (384px)
        prep_frame = self.frame_processor.resize_for_inference(frame, config.FRAME_WIDTH)

        all_detections: List[Detection] = []
        for det in self.detectors:
            try:
                res = await det.detect(prep_frame)
                if res:
                    all_detections.extend(res)
            except Exception as e:
                logger.error(f"Error executing detector {det.name}: {e}")

        # Evaluate against stream safety policies
        decision = self.policy_engine.evaluate(
            stream_id=stream_id,
            camera_id=camera_id,
            detections=all_detections,
            timestamp=timestamp
        )

        return decision

ai_sentinel = AISentinel()
