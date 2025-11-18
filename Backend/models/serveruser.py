from Database.db import Base
from sqlalchemy import Integer, String, ForeignKey, Column
from sqlalchemy.orm import relationship

class ServerUser(Base):
    __tablename__ = 'server_user'

    server_id = Column(
        String,
        ForeignKey('server.id', ondelete="CASCADE"),
        primary_key=True
    )

    user_id = Column(
        String,
        ForeignKey('user.id', ondelete="CASCADE"),
        primary_key=True
    )

    role = Column(String)

    # relationships
    server = relationship("Server", back_populates="users")
    user = relationship("User", back_populates="servers")
