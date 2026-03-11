from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
import os
import uuid
import shutil
import json
from sqlalchemy.orm import Session
from app import deps
from app.schemas.ticket import Ticket, TicketCreate, TicketUpdate, TicketAllocate, TicketResolve, TicketPriority
from app.models.ticket import Ticket as TicketModel, TicketStatus
from app.models.user import User as UserModel, UserRole
from app.models.notification import Notification
from app.models.team import Team as TeamModel
from app.models.document import TicketDocument

router = APIRouter()


@router.get("/", response_model=List[Ticket])
def read_tickets(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve tickets based on user role."""
    query = db.query(TicketModel)

    if current_user.role == UserRole.UNIT:
        query = query.filter(TicketModel.created_by_id == current_user.id)
    elif current_user.role == UserRole.TEAM:
        if not current_user.team_id:
            return []
        query = query.filter(TicketModel.assigned_team_id == current_user.team_id)
    elif current_user.role == UserRole.G1:
        pass

    if status:
        query = query.filter(TicketModel.status == status)

    tickets = query.offset(skip).limit(limit).all()
    return tickets


@router.post("/", response_model=Ticket)
def create_ticket(
    *,
    db: Session = Depends(deps.get_db),
    title: str = Form(...),
    description: str = Form(...),
    priority: TicketPriority = Form(TicketPriority.MEDIUM),
    remarks: Optional[str] = Form(None),
    details: Optional[str] = Form(None),
    files: List[UploadFile] = File(None),
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """Create new ticket."""
    parsed_details = {}
    if details:
        try:
            parsed_details = json.loads(details)
        except json.JSONDecodeError:
            pass # Keep it as empty dict if invalid JSON is passed

    ticket = TicketModel(
        title=title,
        description=description,
        priority=priority,
        remarks=remarks,
        details=parsed_details,
        created_by_id=current_user.id,
        status=TicketStatus.OPEN,
        history=[]
    )
    db.add(ticket)
    db.flush()  # get id before append_history

    if files:
        # Save files locally
        save_dir = os.path.join("..", "data", "ticket_documents", str(ticket.id))
        os.makedirs(save_dir, exist_ok=True)
        for file in files:
            file_extension = os.path.splitext(file.filename)[1]
            unique_name = f"{uuid.uuid4().hex}{file_extension}"
            file_path = os.path.join(save_dir, unique_name)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Save document record with template_name serving as original filename
            doc = TicketDocument(
                ticket_id=ticket.id,
                file_id=unique_name,
                template_name=file.filename,
                document_type="attachment"
            )
            db.add(doc)

    ticket.append_history(
        event="CREATED",
        actor_name=current_user.full_name,
        actor_role=current_user.role.value
    )
    db.commit()
    db.refresh(ticket)

    # Notify G1 users
    try:
        g1_users = db.query(UserModel).filter(UserModel.role == UserRole.G1).all()
        for g1 in g1_users:
            db.add(Notification(
                recipient_id=g1.id,
                ticket_id=ticket.id,
                message=f"New ticket created by {current_user.full_name}: {ticket.title}"
            ))
        db.commit()
    except Exception:
        db.rollback()

    return ticket


@router.get("/{ticket_id}", response_model=Ticket)
def read_ticket(
    *,
    db: Session = Depends(deps.get_db),
    ticket_id: int,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """Get ticket by ID."""
    ticket = db.query(TicketModel).filter(TicketModel.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == UserRole.UNIT and ticket.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if current_user.role == UserRole.TEAM and ticket.assigned_team_id != current_user.team_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return ticket


@router.patch("/{ticket_id}/allocate", response_model=Ticket)
def allocate_ticket(
    *,
    db: Session = Depends(deps.get_db),
    ticket_id: int,
    allocation: TicketAllocate,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """Allocate ticket to a team (G1 only)."""
    if current_user.role not in (UserRole.G1, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    ticket = db.query(TicketModel).filter(TicketModel.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    team = db.query(TeamModel).filter(TeamModel.id == allocation.team_id).first()
    team_name = team.name if team else f"Team#{allocation.team_id}"

    ticket.assigned_team_id = allocation.team_id
    if allocation.priority:
        ticket.priority = allocation.priority
    ticket.status = TicketStatus.ALLOCATED
    ticket.append_history(
        event="ALLOCATED",
        actor_name=current_user.full_name,
        actor_role=current_user.role.value,
        team_id=allocation.team_id,
        team_name=team_name
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Notify team members and unit (creator)
    try:
        team_members = db.query(UserModel).filter(UserModel.team_id == allocation.team_id).all()
        for member in team_members:
            db.add(Notification(
                recipient_id=member.id,
                ticket_id=ticket.id,
                message=f"Ticket allocated to your team: {ticket.title}"
            ))
        if ticket.created_by_id:
            db.add(Notification(
                recipient_id=ticket.created_by_id,
                ticket_id=ticket.id,
                message=f"Your ticket '{ticket.title}' has been allocated to a team."
            ))
        db.commit()
    except Exception:
        db.rollback()

    return ticket


@router.patch("/{ticket_id}/resolve", response_model=Ticket)
def resolve_ticket(
    *,
    db: Session = Depends(deps.get_db),
    ticket_id: int,
    resolution: TicketResolve,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """Mark ticket for review (Team Member only)."""
    if current_user.role not in (UserRole.TEAM, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    ticket = db.query(TicketModel).filter(TicketModel.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # ADMIN can resolve any ticket; TEAM members can only resolve tickets assigned to their team
    if current_user.role == UserRole.TEAM and ticket.assigned_team_id != current_user.team_id:
        raise HTTPException(status_code=403, detail="Ticket not assigned to your team")

    ticket.resolution_notes = resolution.resolution_notes
    ticket.resolved_by_id = current_user.id
    ticket.status = TicketStatus.RESOLVED
    ticket.append_history(
        event="MARKED_FOR_REVIEW",
        actor_name=current_user.full_name,
        actor_role=current_user.role.value,
        notes=resolution.resolution_notes
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Notify G1 and unit (creator)
    try:
        g1_users = db.query(UserModel).filter(UserModel.role == UserRole.G1).all()
        for g1 in g1_users:
            db.add(Notification(
                recipient_id=g1.id,
                ticket_id=ticket.id,
                message=f"Ticket marked for review by {current_user.full_name}: {ticket.title}"
            ))
        if ticket.created_by_id:
            db.add(Notification(
                recipient_id=ticket.created_by_id,
                ticket_id=ticket.id,
                message=f"Your ticket '{ticket.title}' has been marked for review. Please verify."
            ))
        db.commit()
    except Exception:
        db.rollback()

    return ticket


@router.patch("/{ticket_id}/close", response_model=Ticket)
def close_ticket(
    *,
    db: Session = Depends(deps.get_db),
    ticket_id: int,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """Approve and close ticket (Unit User only)."""
    ticket = db.query(TicketModel).filter(TicketModel.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role not in (UserRole.UNIT, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if current_user.role == UserRole.UNIT and ticket.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    ticket.status = TicketStatus.CLOSED
    ticket.append_history(
        event="APPROVED_AND_CLOSED",
        actor_name=current_user.full_name,
        actor_role=current_user.role.value
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Automatically generate Issue Completion Certificate
    try:
        from app.api.v1.endpoints.documents import save_document_data
        from app.models.document_content import CompletionCertificateContent
        import datetime
        
        # Prepare data for the certificate
        closing_data = {
            "ticket_id": ticket.id,
            "title": ticket.title,
            "description": ticket.description,
            "resolution_notes": ticket.resolution_notes,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else "",
            "closed_at": datetime.datetime.utcnow().isoformat(),
            "created_by": ticket.creator.full_name if ticket.creator else "Unknown",
            "resolved_by": ticket.resolver.full_name if ticket.resolver else "N/A",
            "history": ticket.history
        }
        
        save_document_data(
            template_name="issue_completion.html",
            ticket_id=ticket.id,
            data=closing_data,
            db=db,
            document_type="completion_certificate",
            content_model=CompletionCertificateContent
        )
        db.refresh(ticket)
    except Exception as e:
        # We don't want to fail the ticket closure if document generation fails
        # but we should log it
        print(f"Error generating closing document: {e}")

    # Notify team that their resolution was approved
    if ticket.assigned_team_id:
        try:
            team_members = db.query(UserModel).filter(UserModel.team_id == ticket.assigned_team_id).all()
            for member in team_members:
                db.add(Notification(
                    recipient_id=member.id,
                    ticket_id=ticket.id,
                    message=f"Resolution approved for ticket: {ticket.title}"
                ))
            db.commit()
        except Exception:
            db.rollback()

    return ticket


@router.patch("/{ticket_id}/reallocate-to-g1", response_model=Ticket)
def reallocate_to_g1(
    *,
    db: Session = Depends(deps.get_db),
    ticket_id: int,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """Unit rejects resolution — sends ticket back to G1 for reassignment."""
    ticket = db.query(TicketModel).filter(TicketModel.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role not in (UserRole.UNIT, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if current_user.role == UserRole.UNIT and ticket.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    old_team_id = ticket.assigned_team_id
    ticket.status = TicketStatus.OPEN
    ticket.assigned_team_id = None
    ticket.resolved_by_id = None
    ticket.resolution_notes = None
    ticket.append_history(
        event="REALLOCATED_TO_G1",
        actor_name=current_user.full_name,
        actor_role=current_user.role.value,
        notes="Unit rejected resolution — sent back to G1 for reassignment"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Notify G1 and old team (if any)
    try:
        g1_users = db.query(UserModel).filter(UserModel.role == UserRole.G1).all()
        for g1 in g1_users:
            db.add(Notification(
                recipient_id=g1.id,
                ticket_id=ticket.id,
                message=f"Ticket '{ticket.title}' returned by unit — requires reassignment."
            ))
        if old_team_id:
            team_members = db.query(UserModel).filter(UserModel.team_id == old_team_id).all()
            for member in team_members:
                db.add(Notification(
                    recipient_id=member.id,
                    ticket_id=ticket.id,
                    message=f"Your resolution for ticket '{ticket.title}' was rejected by the unit."
                ))
        db.commit()
    except Exception:
        db.rollback()

    return ticket


@router.patch("/{ticket_id}/reallocate-to-team", response_model=Ticket)
def reallocate_to_same_team(
    *,
    db: Session = Depends(deps.get_db),
    ticket_id: int,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """Unit rejects resolution but reassigns to the same team to retry."""
    ticket = db.query(TicketModel).filter(TicketModel.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role not in (UserRole.UNIT, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if current_user.role == UserRole.UNIT and ticket.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if not ticket.assigned_team_id:
        raise HTTPException(status_code=400, detail="No team currently assigned to reallocate to")

    team = db.query(TeamModel).filter(TeamModel.id == ticket.assigned_team_id).first()
    team_name = team.name if team else f"Team#{ticket.assigned_team_id}"

    ticket.status = TicketStatus.ALLOCATED
    ticket.resolved_by_id = None
    ticket.resolution_notes = None
    ticket.append_history(
        event="REALLOCATED_TO_SAME_TEAM",
        actor_name=current_user.full_name,
        actor_role=current_user.role.value,
        team_id=ticket.assigned_team_id,
        team_name=team_name,
        notes="Unit rejected resolution — reassigned to same team to retry"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Notify team to retry
    try:
        team_members = db.query(UserModel).filter(UserModel.team_id == ticket.assigned_team_id).all()
        for member in team_members:
            db.add(Notification(
                recipient_id=member.id,
                ticket_id=ticket.id,
                message=f"Please retry your resolution for ticket: '{ticket.title}'. Unit has returned it."
            ))
        db.commit()
    except Exception:
        db.rollback()

    return ticket
