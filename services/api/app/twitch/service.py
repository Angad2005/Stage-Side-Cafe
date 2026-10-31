import base64
import hashlib
import hmac
import logging
from datetime import datetime, timedelta
from typing import Any, Dict

import httpx
from cryptography.fernet import Fernet

from app.config import settings

logger = logging.getLogger("stageside.twitch")


class TwitchService:
    def __init__(self):
        self.client_id = settings.TWITCH_CLIENT_ID
        self.client_secret = settings.TWITCH_CLIENT_SECRET
        self.extension_secret = settings.TWITCH_EXTENSION_SECRET
        key = base64.urlsafe_b64encode(
            hashlib.sha256(settings.APP_SECRET_KEY.encode("utf-8")).digest()
        )
        self._token_cipher = Fernet(key)

    @property
    def configured(self) -> bool:
        credentials = (self.client_id.strip(), self.client_secret.strip())
        return all(credentials) and not any(
            value.lower().startswith(("your-", "mock-")) for value in credentials
        )

    def authorization_url(self, state: str) -> str:
        from urllib.parse import urlencode

        params = urlencode({
            "client_id": self.client_id,
            "redirect_uri": settings.TWITCH_REDIRECT_URI,
            "response_type": "code",
            "state": state,
        })
        return f"https://id.twitch.tv/oauth2/authorize?{params}"

    def encrypt_token(self, token: str) -> str:
        return self._token_cipher.encrypt(token.encode("utf-8")).decode("ascii")

    def decrypt_token(self, encrypted_token: str) -> str:
        return self._token_cipher.decrypt(encrypted_token.encode("ascii")).decode("utf-8")

    async def exchange_code(self, code: str) -> Dict[str, Any]:
        if not self.configured:
            raise RuntimeError("Twitch credentials are not configured")
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                "https://id.twitch.tv/oauth2/token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": settings.TWITCH_REDIRECT_URI,
                },
            )
            response.raise_for_status()
            return response.json()

    async def validate_access_token(self, access_token: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                "https://id.twitch.tv/oauth2/validate",
                headers={"Authorization": f"OAuth {access_token}"},
            )
            response.raise_for_status()
            return response.json()

    async def get_authorized_user(self, access_token: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                "https://api.twitch.tv/helix/users",
                headers=self.api_headers(access_token),
            )
            response.raise_for_status()
            users = response.json().get("data", [])
            if not users:
                raise RuntimeError("Twitch did not return the authorized account")
            return users[0]

    async def get_stream(self, access_token: str, twitch_user_id: str) -> Dict[str, Any] | None:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                "https://api.twitch.tv/helix/streams",
                params={"user_id": twitch_user_id},
                headers=self.api_headers(access_token),
            )
            response.raise_for_status()
            streams = response.json().get("data", [])
            return streams[0] if streams else None

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                "https://id.twitch.tv/oauth2/token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                },
            )
            response.raise_for_status()
            return response.json()

    async def get_valid_access_token(self, account: Any, db: Any) -> str:
        """Validate each stored Twitch session and refresh it when Twitch rejects it."""
        access_token = self.decrypt_token(account.encrypted_access_token)
        try:
            validation = await self.validate_access_token(access_token)
        except httpx.HTTPStatusError as error:
            if error.response.status_code != 401:
                raise
            try:
                refreshed = await self.refresh_access_token(
                    self.decrypt_token(account.encrypted_refresh_token)
                )
            except httpx.HTTPStatusError as refresh_error:
                if refresh_error.response.status_code == 400:
                    raise RuntimeError("Twitch session expired; reconnect your channel") from refresh_error
                raise
            access_token = refreshed["access_token"]
            account.encrypted_access_token = self.encrypt_token(access_token)
            if refreshed.get("refresh_token"):
                account.encrypted_refresh_token = self.encrypt_token(refreshed["refresh_token"])
            account.token_expires_at = datetime.utcnow() + timedelta(
                seconds=refreshed.get("expires_in", 0)
            )
            account.scopes = ",".join(refreshed.get("scope", []))
            await db.commit()
            await self.validate_access_token(access_token)
        else:
            account.token_expires_at = datetime.utcnow() + timedelta(
                seconds=validation.get("expires_in", 0)
            )
            await db.commit()
        return access_token

    def api_headers(self, access_token: str) -> Dict[str, str]:
        return {
            "Client-Id": self.client_id,
            "Authorization": f"Bearer {access_token}",
        }

    def verify_eventsub_signature(
        self,
        message_id: str,
        timestamp: str,
        body: bytes,
        signature: str,
    ) -> bool:
        """Verifies a Twitch EventSub HMAC-SHA256 signature."""
        if not signature or not self.client_secret:
            return False
        message = message_id.encode("utf-8") + timestamp.encode("utf-8") + body
        expected = "sha256=" + hmac.new(
            self.client_secret.encode("utf-8"),
            message,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, signature)


twitch_service = TwitchService()
