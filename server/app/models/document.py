from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class TicketDocument(Base):
    __tablename__ = "ticket_documents"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    file_id = Column(String, unique=True, index=True, nullable=False)
    template_name = Column(String, nullable=False)
    document_type = Column(String, default="voucher")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ticket = relationship("Ticket", backref="documents")
