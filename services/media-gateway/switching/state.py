from enum import Enum
from typing import Dict, List

class CameraState(str, Enum):
    SAFE = "safe"              # Content verified, releasing approved frames
    SUSPICIOUS = "suspicious"  # Held in buffer while evaluating or reviewing
    UNSAFE = "unsafe"          # Isolated immediately, replaced by safe fallback slate
    ERROR = "error"            # Fail-closed: screening unavailable, held/safe fallback

class StateTransition:
    """
    Enforces the camera safety state machine:
    - UNSAFE or ERROR can ONLY return to SAFE via explicit manual streamer restoration!
    - Next frames looking safe NEVER automatically unblocks a feed.
    """
    VALID_TRANSITIONS: Dict[CameraState, List[CameraState]] = {
        CameraState.SAFE: [CameraState.SUSPICIOUS, CameraState.UNSAFE, CameraState.ERROR],
        CameraState.SUSPICIOUS: [CameraState.SAFE, CameraState.UNSAFE, CameraState.ERROR],
        CameraState.UNSAFE: [CameraState.SAFE, CameraState.ERROR],  # SAFE only via manual restore!
        CameraState.ERROR: [CameraState.SAFE],                      # SAFE only via manual restore!
    }

    @staticmethod
    def can_transition(from_state: CameraState, to_state: CameraState) -> bool:
        return to_state in StateTransition.VALID_TRANSITIONS.get(from_state, [])

    @staticmethod
    def transition(from_state: CameraState, to_state: CameraState) -> CameraState:
        if not StateTransition.can_transition(from_state, to_state):
            raise ValueError(f"Illegal moderation transition: {from_state} -> {to_state}")
        return to_state
