import cv2
import numpy as np
import logging
from typing import Dict, List, Optional
from ..switching.safety_switch import SafetySwitch

logger = logging.getLogger("gateway.compositor")

class ProgramFeedCompositor:
    """
    Composites sanitized camera feeds into a single primary program feed for Twitch RTMP output.
    Only approved safe frames are multiplexed. Blocked cameras render the fallback slate.
    """

    def __init__(self, safety_switch: SafetySwitch, width: int = 1920, height: int = 1080):
        self.safety_switch = safety_switch
        self.width = width
        self.height = height

    def composite_program_frame(self, primary_camera_id: str, secondary_camera_ids: Optional[List[str]] = None) -> np.ndarray:
        # Fetch sanitized frame for primary camera (or fallback slate if blocked)
        main_frame = self.safety_switch.get_safe_frame(primary_camera_id)
        if main_frame.shape[1] != self.width or main_frame.shape[0] != self.height:
            main_frame = cv2.resize(main_frame, (self.width, self.height))

        # Optional Picture-in-Picture layout for secondary cameras
        if secondary_camera_ids:
            pip_w, pip_h = 360, 202
            margin = 24
            for idx, sec_id in enumerate(secondary_camera_ids[:2]):
                sec_frame = self.safety_switch.get_safe_frame(sec_id)
                sec_resized = cv2.resize(sec_frame, (pip_w, pip_h))
                x_offset = self.width - pip_w - margin
                y_offset = margin + idx * (pip_h + margin)
                # Border
                cv2.rectangle(main_frame, (x_offset - 2, y_offset - 2), (x_offset + pip_w + 2, y_offset + pip_h + 2), (99, 102, 241), 2)
                main_frame[y_offset:y_offset + pip_h, x_offset:x_offset + pip_w] = sec_resized

        return main_frame
