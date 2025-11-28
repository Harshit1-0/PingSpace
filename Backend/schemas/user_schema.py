# schemas/user_schema.py
from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    username: str | None = None
    password: str | None = None

class UserResponse(BaseModel):
    id :str 
    username : str
    class Config:
        orm_mode = True
class UserOut(BaseModel):
    id : str
    username: str
    password:str
    

    class Config:
        orm_mode = True


    
