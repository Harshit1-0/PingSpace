# schemas/server_user_schema.py
from pydantic import BaseModel

class ServerUserCreate(BaseModel):
    user_id: str
    server_id: str
    role: str = "member"

class ServerUserResponse(BaseModel):
    id: str
    user_id: str
    server_id: str
    role: str
    class Config:
        orm_mode = True
