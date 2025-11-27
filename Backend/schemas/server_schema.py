# schemas/server_schema.py
from pydantic import BaseModel

class ServerCreate(BaseModel):
    name: str

class ServerUpdate(BaseModel):
    name: str | None = None

class ServerResponse(BaseModel):
    id: str
    name: str
    owner_id: str

    class Config:
        orm_mode = True
