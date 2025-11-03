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
    new_member = manager.check_new(room , username)
    if new_member :
         
        await manager.broadcast(room , f'{username} joined the {room}')
    else : 
         pass
    # messages = (
    #                 db.query(Message)
    #                 .filter(Message.room == get_room.id)
    #                 .order_by(Message.timestamp.asc())
    #                 .all()
    #           )
    # for message in messages :
    #      await websocket.send_text(f'{message.sender} :{message.content}')
    
    try:
         while True :
              data = await websocket.receive_text()
              new_msg = Message(room = get_room.id , sender = username , content = data)
              db.add(new_msg)
              db.commit()
              db.refresh(new_msg)
              
              message = f'{username} : {data}'
              await manager.broadcast(room , data)
    except WebSocketDisconnect :
         manager.disconnect(websocket, username ,room)
         message = f'{username} left the chat'
         



@router.post('/create_room' , response_model=RoomResponse , tags=['room']) 
def create_room(data : RoomCreate , db:Session = Depends(get_db)):
     get_room = db.query(Room).filter(Room.name == data.name).first()
     if get_room :
        raise HTTPException(status_code=400 , detail='Room Already Exist')
     else :
        new_room = Room(name= data.name , description = data.description)
        db.add(new_room)
        db.commit()
        return new_room




@router.get('/get_room' , response_model=list[RoomResponse] , tags=['room'])
def get_room(db:Session = Depends(get_db)):
    get_room = db.query(Room).all()
    return get_room

@router.get('/get_message')
def get_message(db:Session = Depends(get_db)) :
    get_all = db.query(Message).all()
    return get_all  

@router.get('/histroy')
def get_history(room: int, db:Session = Depends(get_db) ) :
     get_chats = db.query(Message).filter(Message.room == room).all()
     return get_chats



