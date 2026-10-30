import time
import threading
from collections import deque
from typing import List, Tuple, Optional
import numpy as np
try:
    from ..switching.state import CameraState
except (ImportError, ValueError):
    from switching.state import CameraState

class RollingBuffer:
    """
    Thread-safe timestamped rolling buffer for a single incoming camera feed.
    
    Holds frames for a configurable duration (2-4 seconds) before release.
    CRITICAL INVARIANT: No frame ever leaves this gateway without explicit safety approval.
    If an unsafe violation occurs, ALL pending unreleased frames in this buffer are instantly purged.
    """

    def __init__(self, camera_id: str, duration_seconds: float = 3.0, max_fps: int = 30):
        self.camera_id = camera_id
        self.duration_seconds = duration_seconds
        self.max_fps = max_fps
        self._buffer: deque = deque()  # (timestamp, frame, is_approved)
        self._lock = threading.Lock()
        self._state: CameraState = CameraState.SAFE
        self._last_approved_ts: float = 0.0

    def push_frame(self, frame: np.ndarray, timestamp: float) -> None:
        with self._lock:
            # If camera is unsafe, do not store pending frames
            if self._state == CameraState.UNSAFE or self._state == CameraState.ERROR:
                return

            self._buffer.append((timestamp, frame, False))

            # Discard frames that are way past maximum buffer limit
            cutoff = timestamp - (self.duration_seconds * 1.5)
            while self._buffer and self._buffer[0][0] < cutoff:
                self._buffer.popleft()

    def get_frames_for_analysis(self, sample_step: int = 6) -> List[Tuple[float, np.ndarray]]:
        """
        Samples frames for AI Sentinel inspection. Does NOT release or delete them.
        """
        with self._lock:
            sampled: List[Tuple[float, np.ndarray]] = []
            for idx, (ts, f, approved) in enumerate(self._buffer):
                if not approved and (idx % sample_step == 0):
                    sampled.append((ts, f))
            return sampled

    def approve_frames_until(self, timestamp: float) -> List[Tuple[float, np.ndarray]]:
        """
        Marks frames up to timestamp as screened & approved, and releases them for downstream broadcasting.
        """
        with self._lock:
            if self._state != CameraState.SAFE:
                return []

            released: List[Tuple[float, np.ndarray]] = []
            new_buffer: deque = deque()

            for ts, f, approved in self._buffer:
                if ts <= timestamp:
                    released.append((ts, f))
                else:
                    new_buffer.append((ts, f, approved))

            self._buffer = new_buffer
            self._last_approved_ts = timestamp
            return released

    def reject_and_purge_all(self) -> int:
        """
        CRITICAL ISOLATION: Purges every unreleased frame in the rolling buffer.
        Guarantees that violating frames never escape to Twitch or LiveKit.
        """
        with self._lock:
            count = len(self._buffer)
            self._buffer.clear()
            self._state = CameraState.UNSAFE
            return count

    def set_state(self, state: CameraState) -> None:
        with self._lock:
            self._state = state

    def get_state(self) -> CameraState:
        with self._lock:
            return self._state

    @property
    def is_safe(self) -> bool:
        with self._lock:
            return self._state == CameraState.SAFE

    @property
    def frame_count(self) -> int:
        with self._lock:
            return len(self._buffer)
