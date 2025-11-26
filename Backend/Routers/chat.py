from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    WebSocket,
    WebSocketDisconnect,
    Query
)
from sqlalchemy.orm import Session
from Database.db import get_db
from jose import JWTError, jwt

from models.user import User
from models.room import Room
from models.message import Message
from models.server import Server
from models.serveruser import ServerUser

from schemas.user_schema import UserOut, UserResponse
from schemas.room_schema import RoomCreate, RoomResponse
from schemas.server_schema import ServerCreate, ServerResponse
from schemas.server_user_schema import ServerUserResponse

from ws.connection_manager import ConnectionManager
from Routers.auth import get_current_user  # JWT authentication

router = APIRouter(tags=["main"])
manager = ConnectionManager()


# ------------------------
# USERS
# ------------------------
@router.get("/users", response_model=list[UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(User).all()


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully"}


# ------------------------
# SERVERS
# ------------------------
@router.post("/servers", response_model=ServerResponse)
def create_server(data: ServerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(Server).filter(Server.name == data.name).first():
        raise HTTPException(status_code=409, detail="Server already exists")
    new_server = Server(name=data.name, owner_id=current_user.id)
    db.add(new_server)
    db.commit()
    db.refresh(new_server)
    return new_server


@router.get("/servers")
def get_servers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Server).join(ServerUser, Server.id == ServerUser.server_id)\
        .filter(ServerUser.user_id == current_user.id).all()


@router.delete("/servers/{server_id}")
def delete_server(server_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    if server.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the server owner can delete the server")
    db.delete(server)
    db.commit()
    return {"detail": "Server deleted successfully"}


# ------------------------
# ROOMS
# ------------------------
@router.post("/rooms", response_model=RoomResponse)
def create_room(data: RoomCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    server = db.query(Server).filter(Server.id == data.server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    if db.query(Room).filter(Room.server_id == data.server_id, Room.name == data.name).first():
        raise HTTPException(status_code=400, detail="Room already exists")
    
    new_room = Room(name=data.name, description=data.description, server_id=data.server_id)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room


@router.get("/rooms/{server_id}", response_model=list[RoomResponse])
def get_rooms_by_server(server_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Room).filter(Room.server_id == server_id).all()


@router.delete("/rooms/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    server = db.query(Server).filter(Server.id == room.server_id).first()
    if server.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only server owner can delete rooms")
    
    db.delete(room)
    db.commit()
    return {"detail": "Room deleted successfully"}


# ------------------------
# MESSAGES
# ------------------------
@router.get("/messages")
def get_messages(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Message).all()


@router.get("/history")
def get_history(room_id: int = Query(...), server_id: int = Query(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Message).filter(Message.room == room_id, Message.server_id == server_id).all()


# ------------------------
# SERVER USERS
# ------------------------
@router.post("/server_users/{user_id}/{server_id}/{role}", response_model=ServerUserResponse)
def create_server_user(user_id: int, server_id: int, role: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    server_user = ServerUser(user_id=user_id, server_id=server_id, role=role)
    db.add(server_user)
    db.commit()
    db.refresh(server_user)
    return server_user


@router.get("/server_users/{user_id}", response_model=list[ServerUserResponse])
def get_servers_for_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ServerUser).filter(ServerUser.user_id == user_id).all()


# ------------------------
# WEBSOCKET CHAT
# ------------------------
@router.websocket("/ws/{server_id}/{room}")
async def chat_socket(websocket: WebSocket, server_id: int, room: str, token: str, db: Session = Depends(get_db)):
    # Decode JWT
    try:
        payload = jwt.decode(token, "your-super-secret-key", algorithms=["HS256"])
        username = payload.get("sub")
        if username is None:
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.close(code=1008)
        return

    room_obj = db.query(Room).filter(Room.server_id == server_id, Room.name == room).first()
    if not room_obj:
        await websocket.close(code=4001)
        return

    await manager.connect(websocket, server_id, room, username)
    try:
        while True:
            msg_text = await websocket.receive_text()
            new_msg = Message(room=room_obj.id, server_id=server_id, sender=username, content=msg_text)
            db.add(new_msg)
            db.commit()
            db.refresh(new_msg)
            payload = {"sender": username, "content": msg_text}
            await manager.broadcast(server_id, room, websocket, payload)
    except WebSocketDisconnect:
    
        manager.disconnect(websocket, server_id, room)