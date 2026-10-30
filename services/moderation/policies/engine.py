from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Optional
from collections import deque
import time
try:
    from ..detectors.base import Detection
except (ImportError, ValueError):
    from detectors.base import Detection

class ModerationAction(str, Enum):
    ALLOW = "allow"
    HOLD = "hold"
    BLOCK = "block"
    FAIL_CLOSED = "fail_closed"

@dataclass
class PolicyRule:
    category: str
    hold_threshold: float = 0.50
    block_threshold: float = 0.85
    enabled: bool = True
    auto_restore: bool = False

@dataclass
class ModerationDecision:
    camera_id: str
    timestamp: float
    action: ModerationAction
    category: Optional[str] = None
    confidence: float = 0.0
    reason: str = "ok"
    detections: List[Detection] = None

class PolicyEngine:
    """
    Evaluates structured signals against stream policies deterministically.
    Never uses an LLM for the camera-cut decision.
    """

    def __init__(self):
        self.default_rules: Dict[str, PolicyRule] = {
            "visual_safety": PolicyRule("visual_safety", 0.50, 0.80),
            "violence": PolicyRule("violence", 0.60, 0.85),
            "privacy": PolicyRule("privacy", 0.40, 0.70),
            "dangerous_activity": PolicyRule("dangerous_activity", 0.50, 0.80),
        }
        self.stream_rules: Dict[str, Dict[str, PolicyRule]] = {}

    def get_rule(self, stream_id: str, category: str) -> PolicyRule:
        if stream_id in self.stream_rules and category in self.stream_rules[stream_id]:
            return self.stream_rules[stream_id][category]
        return self.default_rules.get(category, PolicyRule(category, 0.50, 0.80))

    def evaluate(
        self,
        stream_id: str,
        camera_id: str,
        detections: List[Detection],
        timestamp: float
    ) -> ModerationDecision:
        if not detections:
            return ModerationDecision(
                camera_id=camera_id,
                timestamp=timestamp,
                action=ModerationAction.ALLOW,
                confidence=0.0,
                reason="clean_frame",
                detections=[]
            )

        highest_violation: Optional[Detection] = None
        max_action = ModerationAction.ALLOW

        for det in detections:
            rule = self.get_rule(stream_id, det.category)
            if not rule.enabled:
                continue

            if det.confidence >= rule.block_threshold:
                return ModerationDecision(
                    camera_id=camera_id,
                    timestamp=timestamp,
                    action=ModerationAction.BLOCK,
                    category=det.category,
                    confidence=det.confidence,
                    reason=f"Immediate Block: {det.description} ({det.confidence:.2f} >= {rule.block_threshold:.2f})",
                    detections=detections
                )
            elif det.confidence >= rule.hold_threshold:
                if max_action != ModerationAction.BLOCK:
                    max_action = ModerationAction.HOLD
                    highest_violation = det

        if max_action == ModerationAction.HOLD and highest_violation:
            return ModerationDecision(
                camera_id=camera_id,
                timestamp=timestamp,
                action=ModerationAction.HOLD,
                category=highest_violation.category,
                confidence=highest_violation.confidence,
                reason=f"Held for review: {highest_violation.description}",
                detections=detections
            )

        return ModerationDecision(
            camera_id=camera_id,
            timestamp=timestamp,
            action=ModerationAction.ALLOW,
            confidence=0.0,
            reason="within_policy",
            detections=detections
        )
