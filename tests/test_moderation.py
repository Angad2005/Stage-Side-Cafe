import sys
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(base_dir, "services", "moderation"))

import pytest
import numpy as np
from policies.engine import PolicyEngine, ModerationAction, PolicyRule
from detectors.base import Detection
from preprocessing.frame_processor import FrameProcessor

def test_frame_processor_resizing():
    frame = np.zeros((1080, 1920, 3), dtype=np.uint8)
    resized = FrameProcessor.resize_for_inference(frame, target_size=384)
    assert max(resized.shape[:2]) <= 384

def test_policy_engine_clean_frame():
    engine = PolicyEngine()
    decision = engine.evaluate(
        stream_id="stream_01",
        camera_id="cam_host",
        detections=[],
        timestamp=10.0
    )
    assert decision.action == ModerationAction.ALLOW
    assert decision.confidence == 0.0

def test_policy_engine_immediate_block():
    engine = PolicyEngine()
    # High confidence visual safety violation (0.95 >= default block threshold 0.80)
    det = Detection(
        category="visual_safety",
        subcategory="explicit_imagery",
        confidence=0.95,
        description="Explicit visual violation detected"
    )
    decision = engine.evaluate(
        stream_id="stream_01",
        camera_id="cam_guest",
        detections=[det],
        timestamp=12.5
    )
    # The policy engine must immediately BLOCK the camera feed!
    assert decision.action == ModerationAction.BLOCK
    assert decision.category == "visual_safety"
    assert decision.confidence == 0.95

def test_policy_engine_hold_for_review():
    engine = PolicyEngine()
    # Moderate confidence violation (0.65 is between hold 0.50 and block 0.80)
    det = Detection(
        category="visual_safety",
        subcategory="borderline_imagery",
        confidence=0.65,
        description="Borderline visual safety"
    )
    decision = engine.evaluate(
        stream_id="stream_01",
        camera_id="cam_guest",
        detections=[det],
        timestamp=14.0
    )
    assert decision.action == ModerationAction.HOLD
