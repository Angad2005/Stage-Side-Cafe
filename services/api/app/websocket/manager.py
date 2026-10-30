import json
import logging
from typing import Dict, Set, Optional
from fastapi import WebSocket

logger = logging.getLogger("stageside.websocket")

class ConnectionManager:
    def __init__(self):
        # Map stream_id -> Set of WebSockets
        self.active_streams: Dict[str, Set[WebSocket]] = {}
        # Map user_id -> Set of WebSockets
        self.user_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, stream_id: str, user_id: Optional[str] = None):
        await websocket.accept()
        if stream_id not in self.active_streams:
            self.active_streams[stream_id] = set()
        self.active_streams[stream_id].add(websocket)

        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(websocket)
        logger.info(f"WebSocket client connected to stream {stream_id} (active: {len(self.active_streams[stream_id])})")

    def disconnect(self, websocket: WebSocket, stream_id: str, user_id: Optional[str] = None):
        if stream_id in self.active_streams:
            self.active_streams[stream_id].discard(websocket)
            if not self.active_streams[stream_id]:
                del self.active_streams[stream_id]

        if user_id and user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        logger.info(f"WebSocket client disconnected from stream {stream_id}")

    async def broadcast_to_stream(self, stream_id: str, message: dict):
        if stream_id not in self.active_streams:
            return
        payload = json.dumps(message)
        dead = []
        for ws in self.active_streams[stream_id]:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, stream_id)

    async def send_to_user(self, user_id: str, message: dict):
        if user_id not in self.user_connections:
            return
        payload = json.dumps(message)
        dead = []
        for ws in self.user_connections[user_id]:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            if user_id in self.user_connections:
                self.user_connections[user_id].discard(ws)

ws_manager = ConnectionManager()
