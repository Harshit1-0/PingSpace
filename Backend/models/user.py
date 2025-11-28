from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from Database.db import Base
import uuid

class User(Base):
    __tablename__ = 'user'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid1()))
    username = Column(String, unique=True)
    password = Column(String)

    servers_admin = relationship("Server", back_populates='admin')

    memberships = relationship("ServerUser", back_populates='user')
