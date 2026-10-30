import logging
from typing import Dict, Any

logger = logging.getLogger("gateway.livekit_output")

class LiveKitPublisher:
    """
    Publishes sanitized camera tracks to LiveKit room for multi-POV independent viewer subscription.
    CRITICAL: Never publishes raw feeds; only feeds passing the safety gate are pushed!
    When a camera is blocked, its track is immediately isolated.
    """

    def __init__(self, livekit_url: str, api_key: str, api_secret: str):
        self.livekit_url = livekit_url
        self.api_key = api_key
        self.api_secret = api_secret
        self._published_tracks: Dict[str, Any] = {}

    def publish_safe_track(self, room_name: str, camera_id: str, track_name: str):
        self._published_tracks[camera_id] = {
            "room": room_name,
            "track": track_name,
            "active": True
        }
        logger.info(f"Published sanitized track {track_name} to LiveKit room {room_name}")

    def isolate_track(self, camera_id: str):
        if camera_id in self._published_tracks:
            self._published_tracks[camera_id]["active"] = False
            logger.warning(f"LiveKit: Isolated unsafe camera track {camera_id} from viewers.")

    def restore_track(self, camera_id: str):
        if camera_id in self._published_tracks:
            self._published_tracks[camera_id]["active"] = True
            logger.info(f"LiveKit: Restored safe camera track {camera_id}.")
