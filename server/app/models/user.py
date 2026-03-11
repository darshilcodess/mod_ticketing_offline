from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class UserRole(str, enum.Enum):
    UNIT = "UNIT"
    G1 = "G1"
    TEAM = "TEAM"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(UserRole), default=UserRole.UNIT)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)

    team = relationship("Team", back_populates="members")
    tickets_created = relationship("Ticket", back_populates="creator", foreign_keys="Ticket.created_by_id")
    tickets_resolved = relationship("Ticket", back_populates="resolver", foreign_keys="Ticket.resolved_by_id")
    
    comments = relationship("Comment", back_populates="user")
    notifications = relationship("Notification", back_populates="recipient")
