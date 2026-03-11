from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app import deps
from app.models.user import User as UserModel
from app.models.ticket import Ticket as TicketModel
from app.models.comment import Comment

router = APIRouter()

@router.get("/{ticket_id}/comments", response_model=List[dict])
def read_comments(
    ticket_id: int,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_user)
):
    """
    Retrieve all comments for a specific ticket.
    """
    ticket = db.query(TicketModel).filter(TicketModel.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    comments = db.query(Comment).filter(Comment.ticket_id == ticket_id).order_by(Comment.created_at.asc()).all()
    
    return [
        {
            "id": c.id,
            "content": c.content,
            "created_at": c.created_at,
            "user_id": c.user_id,
            "user_name": c.user.full_name,
            "is_me": c.user_id == current_user.id
        }
        for c in comments
    ]

@router.post("/{ticket_id}/comments", response_model=dict)
def create_comment(
    ticket_id: int,
    comment_data: dict,  # { "content": "..." }
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_user)
):
    """
    Add a new comment to a ticket.
    """
    ticket = db.query(TicketModel).filter(TicketModel.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    content = comment_data.get("content")
    if not content or not content.strip():
        raise HTTPException(status_code=400, detail="Comment content cannot be empty")

    new_comment = Comment(
        content=content,
        ticket_id=ticket_id,
        user_id=current_user.id
    )
    db.add(new_comment)
    
    # Record history event for the comment
    ticket.append_history(
        event="COMMENT_ADDED",
        actor_name=current_user.full_name,
        actor_role=current_user.role.value,
        notes=content[:100] + ("..." if len(content) > 100 else "")
    )
    
    db.commit()
    db.refresh(new_comment)

    # Notify all users that can access the ticket
    try:
        from app.models.notification import Notification
        from app.models.user import UserRole, User as UserModel
        
        recipients = set()
        
        # 1. G1 users
        g1_users = db.query(UserModel).filter(UserModel.role == UserRole.G1).all()
        for g1 in g1_users:
            recipients.add(g1.id)
            
        # 2. Ticket creator
        if ticket.created_by_id:
            recipients.add(ticket.created_by_id)
            
        # 3. Assigned team members
        if ticket.assigned_team_id:
            team_members = db.query(UserModel).filter(UserModel.team_id == ticket.assigned_team_id).all()
            for member in team_members:
                recipients.add(member.id)
                
        # Remove the commenter from recipients
        if current_user.id in recipients:
            recipients.remove(current_user.id)
            
        # Create notifications
        for r_id in recipients:
            db.add(Notification(
                recipient_id=r_id,
                ticket_id=ticket.id,
                message=f"{current_user.full_name} added a comment on ticket '{ticket.title}'"
            ))
        db.commit()
    except Exception as e:
        print(f"Error creating comment notifications: {e}")
        db.rollback()
    
    return {
        "id": new_comment.id,
        "content": new_comment.content,
        "created_at": new_comment.created_at,
        "user_id": new_comment.user_id,
        "user_name": current_user.full_name,
        "is_me": True
    }
