from fastapi import APIRouter , Depends , HTTPException  , status
from sqlalchemy.orm import Session
from schemas.user_schema import UserOut , UserResponse 
from models.user import User 
from Database.db import get_db
from passlib.context import CryptContext
from utils import jwt_handler

pwd_context= CryptContext(schemes=['bcrypt'] , deprecated="auto")

router  = APIRouter()

def hash_password(password) :
    return pwd_context.hash(password)

def verify_password(plain , hashed) :
    return pwd_context.verify(plain , hashed)

@router.post('/signup' , response_model=UserResponse) 
def signUp(user : UserOut, db:Session = Depends(get_db)) :
    get_user = db.query(User).filter(User.username == user.username ).first()
    if get_user :
        raise HTTPException(status_code=409 , detail = "Username already exist")
    hased_passwd = hash_password(user.password)
    new_user = User(username = user.username , password = hased_passwd)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user 

@router.post('/login')
def login(data : UserOut , db:Session = Depends(get_db)) :
    try:
        get_user = db.query(User).filter(User.username == data.username).first()
        if get_user :
            if verify_password( data.password , get_user.password) :
                token = jwt_handler.create_access_token({'sub' : get_user.username})
                return token
            else :
                raise HTTPException(status_code=401, detail="Invalid credentials")
        else:
            raise HTTPException(status_code=400 , detail='Username doesnt exist')
    except HTTPException:
        # Re-raise HTTP exceptions (they already have proper status codes)
        raise
    except Exception as e:
        # Catch any other exceptions and log them
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")




