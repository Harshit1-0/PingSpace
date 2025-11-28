# models/server.py
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from Database.db import Base
import uuid
class Server(Base):
    __tablename__ = 'server'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid1()))
    name = Column(String, nullable=False)

    admin_id = Column(String, ForeignKey('user.id'))
    admin = relationship('User', back_populates='servers_admin')

    rooms = relationship('Room', back_populates='server', cascade="all, delete")
    users = relationship('ServerUser', back_populates='server', cascade="all, delete")
