from sqlalchemy import Column , Integer , String , DateTime , ForeignKey
from Database.db import Base 
from sqlalchemy.orm import relationship
import uuid         
class Room(Base):
    __tablename__ = 'room'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid1()))
    name = Column(String, index=True)
    description = Column(String, nullable=True)

    server_id = Column(String, ForeignKey('server.id', ondelete="CASCADE"))
    server = relationship('Server', back_populates='rooms')