import hmac
import hashlib
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("stageside.twitch")

class TwitchService:
    def __init__(self):
        self.client_id = settings.TWITCH_CLIENT_ID
        self.client_secret = settings.TWITCH_CLIENT_SECRET
        self.extension_secret = settings.TWITCH_EXTENSION_SECRET

    def verify_eventsub_signature(
        self,
        message_id: str,
        timestamp: str,
        body: bytes,
        signature: str
    ) -> bool:
        """Verifies Twitch EventSub HMAC-SHA256 signature."""
        if not signature:
            return False
        message = message_id.encode("utf-8") + timestamp.encode("utf-8") + body
        expected = "sha256=" + hmac.new(
            self.client_secret.encode("utf-8"),
            message,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

twitch_service = TwitchService()
