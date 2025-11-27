# schemas/message_schema.py
from pydantic import BaseModel
from datetime import datetime

class MessageCreate(BaseModel):
    room_id: str
    content: str

class MessageResponse(BaseModel):
    id: str
    room_id: str
    sender: str
    content: str

    class Config:
        orm_mode = True
