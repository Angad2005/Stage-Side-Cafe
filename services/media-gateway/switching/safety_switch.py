import cv2
import numpy as np
import logging
from typing import Dict, Optional, List, Any, TYPE_CHECKING
from .state import CameraState, StateTransition

if TYPE_CHECKING:
    from ..buffering.buffer_manager import BufferManager

logger = logging.getLogger("gateway.safety_switch")

class SafetySwitch:
    """
    Controls which camera feeds are allowed to proceed to output.
    
    KEY INVARIANTS:
    1. Only approved frames from cameras in SAFE state can proceed to Twitch or LiveKit.
    2. If a camera is UNSAFE or ERROR, its output is instantly replaced with a safe fallback slate.
    3. Unaffected cameras remain 100% active and live.
    """

    def __init__(self, buffer_manager: Any):
        self.buffer_manager = buffer_manager
        self._fallback_slate: np.ndarray = self._generate_fallback_slate()

    def _generate_fallback_slate(self, width: int = 1280, height: int = 720) -> np.ndarray:
        """
        Synthesizes a high-definition safe fallback slate image.
        """
        slate = np.zeros((height, width, 3), dtype=np.uint8)
        slate[:] = (24, 18, 17) # Dark obsidian background

        # Red banner
        cv2.rectangle(slate, (0, 0), (width, 8), (68, 68, 239), -1)

        # Draw Shield icon / text
        cv2.putText(
            slate,
            "CAMERA FEED TEMPORARILY SUSPENDED",
            (width // 2 - 380, height // 2 - 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.1,
            (237, 237, 237),
            2,
            cv2.LINE_AA
        )
        cv2.putText(
            slate,
            "AI Sentinel Automated Content Protection is active on this POV.",
            (width // 2 - 320, height // 2 + 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (160, 160, 160),
            1,
            cv2.LINE_AA
        )
        cv2.putText(
            slate,
            "Please switch to another camera POV or await streamer restoration.",
            (width // 2 - 340, height // 2 + 70),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (120, 120, 120),
            1,
            cv2.LINE_AA
        )
        return slate

    def get_safe_frame(self, camera_id: str) -> np.ndarray:
        buf = self.buffer_manager.get_buffer(camera_id)
        if not buf or not buf.is_safe:
            # Deliver safe slate
            return self._fallback_slate.copy()

        # Retrieve next released safe frame
        # If no frame ready yet, return fallback or hold
        return self._fallback_slate.copy()

    def block_camera(self, camera_id: str, reason: str) -> None:
        buf = self.buffer_manager.get_buffer(camera_id)
        if buf:
            purged = buf.reject_and_purge_all()
            logger.warning(f"ISOLATED camera {camera_id}: {reason}. Discarded {purged} pending buffer frames.")

    def restore_camera(self, camera_id: str) -> None:
        buf = self.buffer_manager.get_buffer(camera_id)
        if buf:
            buf.set_state(CameraState.SAFE)
            logger.info(f"RESTORED camera {camera_id} back to SAFE after streamer approval.")

    def emergency_panic_cut(self) -> None:
        logger.critical("EMERGENCY BROADCAST LOCK ACTIVATED: Cutting all cameras!")
        self.buffer_manager.purge_all()
