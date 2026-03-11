from sqlalchemy import Column, Integer, String, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class VoucherContent(Base):
    __tablename__ = "voucher_contents"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("ticket_documents.id"), nullable=False)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    ticket = relationship("Ticket", backref="voucher_content_entries")
    document = relationship("TicketDocument", backref="voucher_content")

class OutboundDeliveryContent(Base):
    __tablename__ = "outbound_delivery_contents"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("ticket_documents.id"), nullable=False)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    ticket = relationship("Ticket", backref="outbound_delivery_entries")
    document = relationship("TicketDocument", backref="outbound_delivery_content")

class VoucherVariableQtyContent(Base):
    __tablename__ = "voucher_variable_qty_contents"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("ticket_documents.id"), nullable=False)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    ticket = relationship("Ticket", backref="voucher_variable_qty_entries")
    document = relationship("TicketDocument", backref="voucher_variable_qty_content")

class VoucherWithTitleContent(Base):
    __tablename__ = "voucher_with_title_contents"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("ticket_documents.id"), nullable=False)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    ticket = relationship("Ticket", backref="voucher_with_title_entries")
    document = relationship("TicketDocument", backref="voucher_with_title_content")

class VoucherWithExplanationContent(Base):
    __tablename__ = "voucher_with_explanation_contents"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("ticket_documents.id"), nullable=False)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    ticket = relationship("Ticket", backref="voucher_with_explanation_entries")
    document = relationship("TicketDocument", backref="voucher_with_explanation_content")
class CompletionCertificateContent(Base):
    __tablename__ = "completion_certificate_contents"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("ticket_documents.id"), nullable=False)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    ticket = relationship("Ticket", backref="completion_certificate_entries")
    document = relationship("TicketDocument", backref="completion_certificate_content")
