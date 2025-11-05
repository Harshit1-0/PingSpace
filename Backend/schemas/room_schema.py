from pydantic import BaseModel
from typing import Optional
class RoomCreate(BaseModel) :
    name :str 
    description : Optional[str]
    server_id : int

class RoomResponse(BaseModel) :
    id : int 
    name : str 
    description : Optional[str]
    server_id : Optional[int]


    class Config:
        orm_mode = True