from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.document import TicketDocument
from app.models.document_content import (
    VoucherContent, OutboundDeliveryContent, 
    VoucherVariableQtyContent, VoucherWithTitleContent, 
    VoucherWithExplanationContent, CompletionCertificateContent
)
from app.services.documents.html_generator import generate_html
from app.services.documents.pdf_generator import html_to_pdf
from app.schemas.document import (
    VoucherRequest, DocumentResponse, 
    OutboundDeliveryRequest, VoucherVariableQtyRequest,
    VoucherTitleRequest, VoucherExplanationRequest
)
import uuid
import os
import logging
from typing import Any, Type

logger = logging.getLogger(__name__)

router = APIRouter()

# Use absolute path for temp directory to ensure consistency across environments
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
TEMP_DIR = os.path.join(BASE_DIR, "temp")


def save_document_data(
    template_name: str,
    ticket_id: int,
    data: dict,
    db: Session,
    document_type: str,
    content_model: Type[Any]
) -> DocumentResponse:
    """Helper to save document metadata and structured content to DB."""
    try:
        file_id = str(uuid.uuid4())
        
        # 1. Store the Document metadata (Template & Type)
        db_doc = TicketDocument(
            ticket_id=ticket_id,
            file_id=file_id,
            template_name=template_name,
            document_type=document_type
        )
        db.add(db_doc)
        db.flush() # Get the ID for the content association

        # 2. Store the structured content data
        content_row = content_model(
            ticket_id=ticket_id,
            document_id=db_doc.id,
            data=data
        )
        db.add(content_row)

        db.commit()
        return DocumentResponse(file_id=file_id, file=f"/api/v1/documents/download/{file_id}")

    except Exception as e:
        db.rollback()
        logger.exception(f"{document_type} storage failed")
        raise HTTPException(status_code=500, detail=f"Failed to save {document_type} data: {str(e)}")


@router.post("/voucher", response_model=DocumentResponse)
def generate_voucher(data: VoucherRequest, db: Session = Depends(get_db)):
    """Store data for a Receipt, Issue and Expense Voucher."""
    return save_document_data(
        template_name="voucher.html",
        ticket_id=data.ticket_id,
        data=data.model_dump(),
        db=db,
        document_type="voucher",
        content_model=VoucherContent
    )


@router.post("/outbound-delivery", response_model=DocumentResponse)
def generate_outbound_delivery(data: OutboundDeliveryRequest, db: Session = Depends(get_db)):
    """Store data for Outbound Delivery."""
    return save_document_data(
        template_name="outbound_delivery.html",
        ticket_id=data.ticket_id,
        data=data.model_dump(),
        db=db,
        document_type="outbound_delivery",
        content_model=OutboundDeliveryContent
    )


@router.post("/voucher-variable-qty", response_model=DocumentResponse)
def generate_voucher_variable_qty(data: VoucherVariableQtyRequest, db: Session = Depends(get_db)):
    """Store data for Voucher with Variable Qty."""
    return save_document_data(
        template_name="voucher_with_variable_qty.html",
        ticket_id=data.ticket_id,
        data=data.model_dump(),
        db=db,
        document_type="voucher_variable_qty",
        content_model=VoucherVariableQtyContent
    )


@router.post("/voucher-title", response_model=DocumentResponse)
def generate_voucher_title(data: VoucherTitleRequest, db: Session = Depends(get_db)):
    """Store data for Voucher with Title."""
    return save_document_data(
        template_name="voucher_with_title.html",
        ticket_id=data.ticket_id,
        data=data.model_dump(),
        db=db,
        document_type="voucher_title",
        content_model=VoucherWithTitleContent
    )


@router.post("/voucher-explanation", response_model=DocumentResponse)
def generate_voucher_explanation(data: VoucherExplanationRequest, db: Session = Depends(get_db)):
    """Store data for Voucher with Explanation."""
    return save_document_data(
        template_name="voucher_with_explanation.html",
        ticket_id=data.ticket_id,
        data=data.model_dump(),
        db=db,
        document_type="voucher_explanation",
        content_model=VoucherWithExplanationContent
    )


@router.get("/download/{file_id}")
def download_document(file_id: str, db: Session = Depends(get_db)):
    """
    Generate the PDF on-the-fly and stream it to the user.
    Fetches template and data from database.
    """
    # 1. Fetch document metadata
    db_doc = db.query(TicketDocument).filter(TicketDocument.file_id == file_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document record not found")

    # Serve static uploaded attachments directly
    if db_doc.document_type == "attachment":
        file_path = os.path.normpath(os.path.join(BASE_DIR, "..", "..", "data", "ticket_documents", str(db_doc.ticket_id), db_doc.file_id))
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Attachment file not found on server")
        
        return FileResponse(
            path=file_path,
            filename=db_doc.template_name,
            content_disposition_type="inline"
        )

    # 2. Identify and fetch content from the correct content table
    CONTENT_MAP = {
        "voucher": VoucherContent,
        "outbound_delivery": OutboundDeliveryContent,
        "voucher_variable_qty": VoucherVariableQtyContent,
        "voucher_title": VoucherWithTitleContent,
        "voucher_explanation": VoucherWithExplanationContent,
        "completion_certificate": CompletionCertificateContent
    }
    
    content_model = CONTENT_MAP.get(db_doc.document_type)
    if not content_model:
        raise HTTPException(status_code=400, detail=f"Unsupported document type: {db_doc.document_type}")
        
    content_row = db.query(content_model).filter(content_model.document_id == db_doc.id).first()
    if not content_row:
        raise HTTPException(status_code=404, detail="Document content not found")

    # 3. Generate PDF on-the-fly
    try:
        os.makedirs(TEMP_DIR, exist_ok=True)
        temp_id = str(uuid.uuid4())
        html_path = os.path.join(TEMP_DIR, f"{temp_id}.html")
        pdf_path = os.path.join(TEMP_DIR, f"{temp_id}.pdf")

        generate_html(db_doc.template_name, content_row.data, html_path)
        
        landscape = db_doc.document_type == "outbound_delivery"
        html_to_pdf(html_path, pdf_path, landscape=landscape)

        # 4. Stream and cleanup
        from starlette.background import BackgroundTasks
        background_tasks = BackgroundTasks()
        
        def cleanup_temp_files():
            try:
                if os.path.exists(html_path): os.remove(html_path)
                if os.path.exists(pdf_path): os.remove(pdf_path)
            except Exception as e:
                logger.error(f"Failed to cleanup temp files: {e}")

        background_tasks.add_task(cleanup_temp_files)

        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=f"{db_doc.document_type}_{file_id}.pdf",
            background=background_tasks,
            content_disposition_type="inline"
        )

    except Exception as e:
        logger.exception("On-demand PDF generation failed")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@router.get("/content/{file_id}")
def get_document_content(file_id: str, db: Session = Depends(get_db)):
    """Fetch the raw structured data for a document to populate edit forms."""
    db_doc = db.query(TicketDocument).filter(TicketDocument.file_id == file_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document record not found")

    CONTENT_MAP = {
        "voucher": VoucherContent,
        "outbound_delivery": OutboundDeliveryContent,
        "voucher_variable_qty": VoucherVariableQtyContent,
        "voucher_title": VoucherWithTitleContent,
        "voucher_explanation": VoucherWithExplanationContent,
        "completion_certificate": CompletionCertificateContent
    }
    
    content_model = CONTENT_MAP.get(db_doc.document_type)
    content_row = db.query(content_model).filter(content_model.document_id == db_doc.id).first()
    if not content_row:
        raise HTTPException(status_code=404, detail="Document content not found")

    return {
        "document_type": db_doc.document_type,
        "template_name": db_doc.template_name,
        "data": content_row.data
    }

@router.put("/{file_id}")
def update_document_content(file_id: str, payload: dict, db: Session = Depends(get_db)):
    """Update existing document structured data."""
    db_doc = db.query(TicketDocument).filter(TicketDocument.file_id == file_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document record not found")

    CONTENT_MAP = {
        "voucher": VoucherContent,
        "outbound_delivery": OutboundDeliveryContent,
        "voucher_variable_qty": VoucherVariableQtyContent,
        "voucher_title": VoucherWithTitleContent,
        "voucher_explanation": VoucherWithExplanationContent,
        "completion_certificate": CompletionCertificateContent
    }
    
    content_model = CONTENT_MAP.get(db_doc.document_type)
    content_row = db.query(content_model).filter(content_model.document_id == db_doc.id).first()
    if not content_row:
        raise HTTPException(status_code=404, detail="Document content not found")

    # Update the JSON data - payload is now the full model data from frontend
    content_row.data = payload
        
    db.commit()
    return {"status": "success", "message": "Document updated"}
