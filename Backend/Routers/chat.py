# Routers/main.py
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    Query,
    status
)
from sqlalchemy.orm import Session
from Database.db import get_db
from jose import jwt

from models.user import User
from models.room import Room
from models.message import Message
from models.server import Server
from models.serveruser import ServerUser

from schemas.user_schema import UserOut, UserUpdate
from schemas.room_schema import RoomCreate, RoomResponse, RoomUpdate
from schemas.server_schema import ServerCreate, ServerResponse, ServerUpdate
from schemas.message_schema import MessageResponse, MessageCreate
from schemas.server_user_schema import ServerUserCreate, ServerUserResponse
from Routers.auth import hash_password

from ws.connection_manager import ConnectionManager
from Routers.auth import get_current_user

router = APIRouter(tags=["main"])
manager = ConnectionManager()
JWT_SECRET = "your-super-secret-key"

# ------------------------
# USERS - Full CRUD
# ------------------------
@router.get("/users", response_model=list[UserOut])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(User).all()

@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user

@router.put("/users/{user_id}", response_model=UserOut)
def update_user(user_id: str, payload: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if payload.username:
        user.username = payload.username
    
    if payload.password:
        user.hashed_password = hash_password(payload.password)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully"}

# ------------------------
# SERVERS - Full CRUD
# ------------------------
@router.post("/servers", response_model=ServerResponse)
def create_server(data: ServerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(Server).filter(Server.name == data.name, Server.owner_id == current_user.id).first():
        raise HTTPException(status_code=409, detail="Server already exists for this owner")
    new_server = Server(name=data.name, owner_id=current_user.id)
    db.add(new_server)
    db.commit()
    db.refresh(new_server)
    # add owner as server user
    owner_link = ServerUser(user_id=current_user.id, server_id=new_server.id, role="owner")
    db.add(owner_link)
    db.commit()
    return new_server

@router.get("/servers", response_model=list[ServerResponse])
def get_servers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # servers where user is member
    server_ids = [su.server_id for su in db.query(ServerUser).filter(ServerUser.user_id == current_user.id).all()]
    return db.query(Server).filter(Server.id.in_(server_ids)).all()

@router.get("/servers/{server_id}", response_model=ServerResponse)
def get_server(server_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(404, "Server not found")
    # check membership
    if not db.query(ServerUser).filter(ServerUser.server_id == server_id, ServerUser.user_id == current_user.id).first():
        raise HTTPException(status_code=403, detail="Not a member of this server")
    return server

@router.put("/servers/{server_id}", response_model=ServerResponse)
def update_server(server_id: str, payload: ServerUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(404, "Server not found")
    if server.owner_id != current_user.id:
        raise HTTPException(403, "Only owner can update server")
    if payload.name:
        server.name = payload.name
    db.add(server)
    db.commit()
    db.refresh(server)
    return server

@router.delete("/servers/{server_id}")
def delete_server(server_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(404, "Server not found")
    if server.owner_id != current_user.id:
        raise HTTPException(403, "Only the server owner can delete the server")
    # delete server users and rooms/messages cascade manually (simple approach)
    db.query(ServerUser).filter(ServerUser.server_id == server_id).delete()
    db.query(Message).filter(Message.server_id == server_id).delete()
    db.query(Room).filter(Room.server_id == server_id).delete()
    db.delete(server)
    db.commit()
    return {"detail": "Server deleted successfully"}

# ------------------------
# ROOMS - Full CRUD
# ------------------------
@router.post("/rooms", response_model=RoomResponse)
def create_room(data: RoomCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    server = db.query(Server).filter(Server.id == data.server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    # only members can create rooms
    if not db.query(ServerUser).filter(ServerUser.server_id == data.server_id, ServerUser.user_id == current_user.id).first():
        raise HTTPException(status_code=403, detail="Not a member of server")
    if db.query(Room).filter(Room.server_id == data.server_id, Room.name == data.name).first():
        raise HTTPException(status_code=400, detail="Room already exists")
    new_room = Room(name=data.name, description=data.description or "", server_id=data.server_id)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

@router.get("/rooms/{server_id}", response_model=list[RoomResponse])
def get_rooms_by_server(server_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not db.query(ServerUser).filter(ServerUser.server_id == server_id, ServerUser.user_id == current_user.id).first():
        raise HTTPException(status_code=403, detail="Not a member of server")
    return db.query(Room).filter(Room.server_id == server_id).all()

@router.get("/room/{room_id}", response_model=RoomResponse)
def get_room(room_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(404, "Room not found")
    if not db.query(ServerUser).filter(ServerUser.server_id == room.server_id, ServerUser.user_id == current_user.id).first():
        raise HTTPException(status_code=403, detail="Not a member of server")
    return room

@router.put("/rooms/{room_id}", response_model=RoomResponse)
def update_room(room_id: str, payload: RoomUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(404, "Room not found")
    server = db.query(Server).filter(Server.id == room.server_id).first()
    if server.owner_id != current_user.id:
        raise HTTPException(403, "Only server owner can update rooms")
    if payload.name:
        room.name = payload.name
    if payload.description is not None:
        room.description = payload.description
    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.delete("/rooms/{room_id}")
def delete_room(room_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(404, "Room not found")
    server = db.query(Server).filter(Server.id == room.server_id).first()
    if server.owner_id != current_user.id:
        raise HTTPException(403, "Only server owner can delete rooms")
    db.query(Message).filter(Message.room == room.id).delete()
    db.delete(room)
    db.commit()
    return {"detail": "Room deleted successfully"}

# ------------------------
# MESSAGES - CRUD (create + query + delete)
# ------------------------
@router.post("/messages", response_model=MessageResponse)
def post_message(payload: MessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # check membership
    if not db.query(ServerUser).filter(ServerUser.server_id == payload.server_id, ServerUser.user_id == current_user.id).first():
        raise HTTPException(403, "Not a member of server")
    room = db.query(Room).filter(Room.id == payload.room, Room.server_id == payload.server_id).first()
    if not room:
        raise HTTPException(404, "Room not found")
    new_msg = Message(server_id=payload.server_id, room=payload.room, sender=current_user.username, content=payload.content)
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

@router.get("/messages/{server_id}/{room_id}", response_model=list[MessageResponse])
def get_history(server_id: str, room_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not db.query(ServerUser).filter(ServerUser.server_id == server_id, ServerUser.user_id == current_user.id).first():
        raise HTTPException(403, "Not a member of server")
    return db.query(Message).filter(Message.server_id == server_id, Message.room == room_id).order_by(Message.created_at).all()

@router.delete("/messages/{message_id}")
def delete_message(message_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(404, "Message not found")
    # allow sender or server owner to delete
    server = db.query(Server).filter(Server.id == msg.server_id).first()
    if msg.sender != current_user.username and server.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized to delete message")
    db.delete(msg)
    db.commit()
    return {"detail": "Message deleted"}

# ------------------------
# SERVER USERS - Full CRUD
# ------------------------
@router.post("/server_users", response_model=ServerUserResponse)
def create_server_user(payload: ServerUserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # only server owner or admin can add
    server = db.query(Server).filter(Server.id == payload.server_id).first()
    if not server:
        raise HTTPException(404, "Server not found")
    owner_check = db.query(ServerUser).filter(ServerUser.server_id == payload.server_id, ServerUser.user_id == current_user.id).first()
    if not owner_check or (server.owner_id != current_user.id and owner_check.role not in ("owner", "admin")):
        raise HTTPException(403, "Only owner/admin can add users")
    if db.query(ServerUser).filter(ServerUser.user_id == payload.user_id, ServerUser.server_id == payload.server_id).first():
        raise HTTPException(409, "User already in server")
    su = ServerUser(user_id=payload.user_id, server_id=payload.server_id, role=payload.role)
    db.add(su)
    db.commit()
    db.refresh(su)
    return su

@router.get("/server_users/{user_id}", response_model=list[ServerUserResponse])
def get_servers_for_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # only the same user or admin of servers can query
    if user_id != current_user.id:
        # allow if current_user has admin in any of the same servers
        ok = db.query(ServerUser).filter(ServerUser.user_id == current_user.id, ServerUser.role.in_(["owner","admin"])).first()
        if not ok:
            raise HTTPException(403, "Not authorized")
    return db.query(ServerUser).filter(ServerUser.user_id == user_id).all()

@router.delete("/server_users/{su_id}")
def delete_server_user(su_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    su = db.query(ServerUser).filter(ServerUser.id == su_id).first()
    if not su:
        raise HTTPException(404, "ServerUser not found")
    server = db.query(Server).filter(Server.id == su.server_id).first()
    if server.owner_id != current_user.id and current_user.id != su.user_id:
        raise HTTPException(403, "Only owner or the user themselves can remove membership")
    db.delete(su)
    db.commit()
    return {"detail": "Server user removed"}

# ------------------------
# WEBSOCKET CHAT
# ------------------------
@router.websocket("/ws/{server_id}/{room}")
async def chat_socket(websocket: WebSocket, server_id: str, room: str, token: str, db: Session = Depends(get_db)):
    # Decode JWT (token param)
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        username = payload.get("sub")
        if username is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
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
            payload = {"sender": username, "content": msg_text, "created_at": str(new_msg.created_at)}
            await manager.broadcast(server_id, room, websocket, payload)
    except WebSocketDisconnect:
        manager.disconnect(websocket, server_id, room)
