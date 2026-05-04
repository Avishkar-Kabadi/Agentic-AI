from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
from app.core.security import decode_token

router = APIRouter(tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        # Maps user_id to a set of active websockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, ws: WebSocket, user_id: str):
        await ws.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(ws)

    def disconnect(self, ws: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(ws)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def broadcast_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=1008)
        return
    
    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=1008)
        return
        
    user_id = str(user_id)
    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text() # keep connection open
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

