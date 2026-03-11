from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from app.models.ticket import TicketStatus, TicketPriority
from app.schemas.user import User
from app.schemas.team import TeamInDBBase

class TicketBase(BaseModel):
    title: str
    description: str
    priority: TicketPriority = TicketPriority.MEDIUM
    remarks: Optional[str] = None
    details: Optional[dict] = None

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TicketPriority] = None
    status: Optional[TicketStatus] = None
    assigned_team_id: Optional[int] = None
    resolution_notes: Optional[str] = None

class TicketAllocate(BaseModel):
    team_id: int
    priority: Optional[TicketPriority] = None

class TicketResolve(BaseModel):
    resolution_notes: str

class TicketInDBBase(TicketBase):
    id: int
    status: TicketStatus
    created_by_id: int
    assigned_team_id: Optional[int] = None
    resolved_by_id: Optional[int] = None
    resolution_notes: Optional[str] = None
    history: Optional[List[Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

from app.schemas.document import TicketDocumentSchema

class Ticket(TicketInDBBase):
    creator: User
    assigned_team: Optional[TeamInDBBase] = None
    resolver: Optional[User] = None
    documents: List[TicketDocumentSchema] = []
