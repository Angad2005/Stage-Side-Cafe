import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional
from .manager import ws_manager

router = APIRouter(tags=["websocket"])

@router.websocket("/ws/streams/{stream_id}")
async def websocket_stream_endpoint(
    websocket: WebSocket,
    stream_id: str,
    token: Optional[str] = Query(None)
):
    user_id = None
    if token:
        from app.auth.jwt import decode_access_token
        payload = decode_access_token(token)
        if payload:
            user_id = payload.get("sub")

    await ws_manager.connect(websocket, stream_id, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                # Handle client ping/pong or client action
                if msg.get("action") == "ping":
                    await websocket.send_text(json.dumps({"event": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, stream_id, user_id)
