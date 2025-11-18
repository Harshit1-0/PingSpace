from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from Database.db import Base
import uuid

class User(Base):
    __tablename__ = 'user'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid1()))
    username = Column(String, unique=True)
    password = Column(String)
    server = relationship("Server", back_populates='owner')
    servers = relationship("ServerUser" , back_populates='user')
