from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    WebSocket,
    WebSocketDisconnect
)

from sqlalchemy.orm import Session
from Database.db import get_db
from models.user import User
from models.room import Room
from models.message import Message
from schemas.user_schema import UserOut, UserResponse
from schemas.room_schema import RoomCreate, RoomResponse
from ws.connection_manager import ConnectionManager
from schemas.server_schema import ServerCreate , ServerResponse
from models.server import Server
from models.serveruser import ServerUser
from schemas.server_user_schema import ServerUserResponse , CreateServerUser


router = APIRouter()
manager = ConnectionManager()
@router.get('/')
def get_all_user(db:Session = Depends(get_db)) :
    users = db.query(User).all()
    return users


@router.delete('/{id}')
def delete_user(id ,  db:Session = Depends(get_db)) :
        get_user = db.query(User).filter(User.id == id ).first()
        if  get_user :
            db.delete(get_user)
            db.commit()
            return "user deleted successfully"
        else :
             return f'There is no user with this {id}'
@router.websocket('/ws/{room}/{username}')
async def chatSocket(websocket: WebSocket, room: str, username: str , db:Session = Depends(get_db)):
    
    get_room = db.query(Room).filter(Room.name == room).first()
    if not get_room :
         await websocket.close(code=4001)
         print(f'there is no room like {room}')
         return 


    await manager.connect(websocket , room , username)
    
    try:
         while True :
              data = await websocket.receive_text()
              new_msg = Message(room = get_room.id , sender = username , content = data)
              db.add(new_msg)
              db.commit()
              db.refresh(new_msg)
             # broadcast a structured payload so clients can render correctly
              payload = {"sender": username, "content": data}
              await manager.broadcast(room ,websocket, payload)
    except WebSocketDisconnect :
         manager.disconnect(websocket, room)
         message = f'{username} left the chat'
         



@router.post('/create_room' , response_model=RoomResponse , tags=['room']) 
def create_room(data : RoomCreate , db:Session = Depends(get_db)):
     get_room = db.query(Room).filter(Room.name == data.name).first()
     if get_room :
        raise HTTPException(status_code=400 , detail='Room Already Exist')
     else :
        # Validate server exists before creating the room
        server = db.query(Server).filter(Server.id == data.server_id).first()
        if not server:
            raise HTTPException(status_code=404, detail='Server not found')

        new_room = Room(name= data.name , description = data.description, server_id=data.server_id)
        db.add(new_room)
        db.commit()
        db.refresh(new_room)
        return new_room

@router.get('room/{server_id}' , tags = ['room']) 
def get_room_by_server_Id(server_id , db:Session = Depends(get_db)) :
    get_room = db.query(Room).filter(Room.server_id == server_id).all()
    return get_room
@router.post('/create_server' , response_model=ServerResponse , tags = ['server'])
def create_server(data:ServerCreate , db:Session = Depends(get_db)) :
    get_server = db.query(Server).filter(Server.name == data.name).first()

    if(get_server) :
        raise HTTPException(status_code=409 , detail='Server already exists')
    new_server = Server(name =data.name , owner_id = data.owner_id)
    db.add(new_server)
    db.commit()
    db.refresh(new_server)
    return new_server

@router.get('/get_server' , response_model = list[ServerResponse] , tags = ['server'])
def get_server(db:Session = Depends(get_db)) :
    servers = db.query(Server).all()
    return servers

@router.get('/get_room' , response_model=list[RoomResponse] , tags=['room'])
def get_room(db:Session = Depends(get_db)):
    get_room = db.query(Room).all()
    return get_room

@router.delete('/delete_room/{id}' , tags = ['room'])
def delete_room(id , db:Session = Depends(get_db)) :
    get_room = db.query(Room).filter(Room.id == id).first()
    if(get_room) :
         db.delete(get_room)
         db.commit()
         return get_room
    else :
         return "There is no room like this"
@router.get('/get_message/')
def get_message(db:Session = Depends(get_db)) :
    get_all = db.query(Message).all()
    return get_all  

@router.get('/histroy')
def get_history(room: str, db:Session = Depends(get_db) ) :
     get_chats = db.query(Message).filter(Message.room == room).all()
     return get_chats


# for ServerUser model 
@router.post('/serverUser/{user_id}/{server_id}/{role}' , response_model=ServerUserResponse)
def create_server_user(user_id , server_id ,role ,  db : Session = Depends(get_db)):
     get_userid = db.query(ServerUser).filter(ServerUser.user_id== user_id).first()
     if get_userid :
          raise HTTPException(status_code= 401 , detail = "user is already in this room")
     new_server_user = ServerUser(user_id = user_id, server_id = server_id , role = role)
     db.add(new_server_user)
     db.commit()
     db.refresh(new_server_user)
     return new_server_user
@router.get('/serverUser/{user_id}')
def get_users_server(user_id , db:Session = Depends(get_db)) :
     get_server = db.query(ServerUser).filter(ServerUser.user_id == user_id).all()
     
     return get_server

