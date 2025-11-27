# schemas/user_schema.py
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    username: str | None = None
    password: str | None = None

class UserOut(BaseModel):
    id: str
    username: str

    class Config:
        orm_mode = True

class UserResponse(UserOut):
    pass
