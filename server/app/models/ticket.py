from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum
import datetime as dt

class TicketStatus(str, enum.Enum):
    OPEN = "OPEN"           # Created by Unit
    ALLOCATED = "ALLOCATED" # Assigned to Team by G1
    RESOLVED = "RESOLVED"   # Resolved by Team
    CLOSED = "CLOSED"       # Confirmed by Unit

class TicketPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN)
    priority = Column(Enum(TicketPriority), default=TicketPriority.MEDIUM)
    remarks = Column(Text, nullable=True)
    details = Column(JSON, default=dict, nullable=True)
    
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    resolved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    resolution_notes = Column(Text, nullable=True)
    history = Column(JSON, default=list, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", back_populates="tickets_created", foreign_keys=[created_by_id])
    assigned_team = relationship("Team", back_populates="tickets")
    resolver = relationship("User", back_populates="tickets_resolved", foreign_keys=[resolved_by_id])
    
    comments = relationship("Comment", back_populates="ticket", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="ticket")

    def append_history(self, event: str, actor_name: str, actor_role: str, team_id=None, team_name=None, notes=None):
        """Append a history event to the ticket's history JSON column."""
        from sqlalchemy.orm.attributes import flag_modified
        current = self.history or []
        current.append({
            "event": event,
            "actor": actor_name,
            "role": actor_role,
            "team_id": team_id,
            "team_name": team_name,
            "notes": notes,
            "timestamp": dt.datetime.utcnow().isoformat()
        })
        self.history = current
        flag_modified(self, "history")
