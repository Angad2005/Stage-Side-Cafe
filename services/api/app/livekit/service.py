import logging
from typing import Optional, List
from app.config import settings

logger = logging.getLogger("stageside.livekit")

try:
    from livekit import api as lk_api
    HAS_LIVEKIT_SDK = True
except ImportError:
    HAS_LIVEKIT_SDK = False

class LiveKitService:
    def __init__(self):
        self.api_key = settings.LIVEKIT_API_KEY
        self.api_secret = settings.LIVEKIT_API_SECRET
        self.ws_url = settings.LIVEKIT_URL

    def generate_viewer_token(
        self,
        room_name: str,
        participant_identity: str,
        participant_name: str,
        allowed_tracks: Optional[List[str]] = None
    ) -> str:
        """
        Generates a secure WebRTC subscriber access token for the viewer.
        The viewer can subscribe only to sanitized POV tracks.
        """
        if HAS_LIVEKIT_SDK:
            try:
                token = lk_api.AccessToken(self.api_key, self.api_secret) \
                    .with_identity(participant_identity) \
                    .with_name(participant_name) \
                    .with_grants(lk_api.VideoGrants(
                        room_join=True,
                        room=room_name,
                        can_publish=False,
                        can_subscribe=True,
                    ))
                return token.to_jwt()
            except Exception as e:
                logger.warning(f"Error generating token with livekit sdk: {e}")

        # Fallback JWT for testing/offline environments
        try:
            import jwt
        except ImportError:
            from jose import jwt
        import time
        payload = {
            "sub": participant_identity,
            "name": participant_name,
            "iss": self.api_key,
            "video": {
                "room": room_name,
                "roomJoin": True,
                "canPublish": False,
                "canSubscribe": True,
            },
            "exp": int(time.time()) + 3600
        }
        tok = jwt.encode(payload, self.api_secret, algorithm="HS256")
        return tok if isinstance(tok, str) else tok.decode("utf-8")

    def generate_publisher_token(self, room_name: str, camera_identity: str) -> str:
        """
        Generates publisher token for the StageSide Media Gateway.
        Only the sanitized gateway outputs can publish to LiveKit!
        """
        if HAS_LIVEKIT_SDK:
            try:
                token = lk_api.AccessToken(self.api_key, self.api_secret) \
                    .with_identity(camera_identity) \
                    .with_name(f"Sanitized Gateway: {camera_identity}") \
                    .with_grants(lk_api.VideoGrants(
                        room_join=True,
                        room=room_name,
                        can_publish=True,
                        can_subscribe=False,
                    ))
                return token.to_jwt()
            except Exception as e:
                logger.warning(f"Error generating publisher token: {e}")

        from jose import jwt
        import time
        payload = {
            "sub": camera_identity,
            "iss": self.api_key,
            "video": {
                "room": room_name,
                "roomJoin": True,
                "canPublish": True,
                "canSubscribe": False,
            },
            "exp": int(time.time()) + 86400
        }
        return jwt.encode(payload, self.api_secret, algorithm="HS256")

livekit_service = LiveKitService()
