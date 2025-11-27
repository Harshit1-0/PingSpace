# schemas/room_schema.py
from pydantic import BaseModel

class RoomCreate(BaseModel):
    name: str
    description: str | None = ""
    server_id: str

class RoomUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

class RoomResponse(BaseModel):
    id: str
    name: str
    description: str | None
    server_id: str

    class Config:
        orm_mode = True
