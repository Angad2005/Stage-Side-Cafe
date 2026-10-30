import json
import logging
from typing import Optional, Dict, Any, List
try:
    import redis.asyncio as aioredis
    HAS_REDIS = True
except ImportError:
    aioredis = None
    HAS_REDIS = False
from app.config import settings

logger = logging.getLogger("stageside.redis")

class RedisManager:
    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self._client: Optional[aioredis.Redis] = None
        self._memory_fallback: Dict[str, Any] = {}

    async def connect(self):
        if not HAS_REDIS:
            logger.info("Redis package not installed. Running RedisManager in in-memory fallback mode.")
            return
        try:
            self._client = aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=2.0
            )
            await self._client.ping()
            logger.info("Connected to Redis successfully.")
        except Exception as e:
            logger.warning(f"Could not connect to Redis at {self.redis_url} ({e}). Using in-memory fallback store.")
            self._client = None

    async def close(self):
        if self._client:
            await self._client.close()

    async def get(self, key: str) -> Optional[str]:
        if self._client:
            try:
                return await self._client.get(key)
            except Exception:
                pass
        return self._memory_fallback.get(key)

    async def set(self, key: str, value: str, ex: Optional[int] = None):
        if self._client:
            try:
                await self._client.set(key, value, ex=ex)
                return
            except Exception:
                pass
        self._memory_fallback[key] = value

    async def set_camera_status(self, camera_id: str, status: str, moderation_state: str = "safe"):
        data = json.dumps({"status": status, "moderation_state": moderation_state})
        await self.set(f"camera:{camera_id}:state", data)

    async def get_camera_status(self, camera_id: str) -> Dict[str, str]:
        raw = await self.get(f"camera:{camera_id}:state")
        if raw:
            try:
                return json.loads(raw)
            except Exception:
                pass
        return {"status": "offline", "moderation_state": "safe"}

    async def set_stream_status(self, stream_id: str, status: str):
        await self.set(f"stream:{stream_id}:status", status)

    async def get_stream_status(self, stream_id: str) -> str:
        res = await self.get(f"stream:{stream_id}:status")
        return res or "created"

    async def set_viewer_camera(self, user_id: str, stream_id: str, camera_id: str):
        await self.set(f"viewer:{user_id}:{stream_id}:camera", camera_id)

    async def get_viewer_camera(self, user_id: str, stream_id: str) -> Optional[str]:
        return await self.get(f"viewer:{user_id}:{stream_id}:camera")

    async def publish_event(self, channel: str, event_data: dict):
        payload = json.dumps(event_data)
        if self._client:
            try:
                await self._client.publish(channel, payload)
                return
            except Exception:
                pass
        # Fallback local notification
        logger.debug(f"[Redis Mock PubSub] Channel: {channel} Data: {payload}")

redis_manager = RedisManager()

async def get_redis() -> RedisManager:
    return redis_manager
