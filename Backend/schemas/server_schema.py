# schemas/server_schema.py
from pydantic import BaseModel

class ServerCreate(BaseModel):
    name: str

class ServerUpdate(BaseModel):
    name: str | None = None

class UsersList(BaseModel) :
    id : str
    
    username :str
    role:str
    
    class Config :
        orm_mode = True

class ServerResponse(BaseModel):
    id: str
    name: str
    admin_id: str

    class Config:
        orm_mode = True
