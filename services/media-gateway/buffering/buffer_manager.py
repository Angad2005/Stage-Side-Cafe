import logging
from typing import Dict, Optional, List
from .rolling_buffer import RollingBuffer
try:
    from ..switching.state import CameraState
except (ImportError, ValueError):
    from switching.state import CameraState

logger = logging.getLogger("gateway.buffer_manager")

class BufferManager:
    """Manages separate RollingBuffer instances for all active cameras."""

    def __init__(self, default_duration: float = 3.0):
        self.default_duration = default_duration
        self._buffers: Dict[str, RollingBuffer] = {}

    def get_or_create(self, camera_id: str, duration: Optional[float] = None) -> RollingBuffer:
        if camera_id not in self._buffers:
            dur = duration or self.default_duration
            self._buffers[camera_id] = RollingBuffer(camera_id=camera_id, duration_seconds=dur)
            logger.info(f"Created rolling buffer for camera {camera_id} with duration {dur}s")
        return self._buffers[camera_id]

    def get_buffer(self, camera_id: str) -> Optional[RollingBuffer]:
        return self._buffers.get(camera_id)

    def remove_buffer(self, camera_id: str):
        if camera_id in self._buffers:
            del self._buffers[camera_id]

    def all_cameras(self) -> List[str]:
        return list(self._buffers.keys())

    def purge_camera(self, camera_id: str) -> int:
        buf = self.get_buffer(camera_id)
        if buf:
            return buf.reject_and_purge_all()
        return 0

    def purge_all(self):
        """Emergency panic cut: Purges all camera buffers."""
        for cam_id, buf in self._buffers.items():
            buf.reject_and_purge_all()
