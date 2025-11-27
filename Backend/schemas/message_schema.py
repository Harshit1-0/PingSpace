# schemas/message_schema.py
from pydantic import BaseModel
from datetime import datetime

class MessageCreate(BaseModel):
    server_id: str
    room: str
    content: str

class MessageResponse(BaseModel):
    id: str
    server_id: str
    room: str
    sender: str
    content: str
    created_at: datetime

    class Config:
        orm_mode = True
