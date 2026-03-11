from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import deps
from app.schemas.team import Team, TeamCreate, TeamUpdate
from app.models.team import Team as TeamModel
from app.models.user import User as UserModel, UserRole

router = APIRouter()

@router.get("/", response_model=List[Team])
def read_teams(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve teams.
    """
    teams = db.query(TeamModel).offset(skip).limit(limit).all()
    return teams

@router.post("/", response_model=Team)
def create_team(
    *,
    db: Session = Depends(deps.get_db),
    team_in: TeamCreate,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new team. Only Admin or G1 should technically do this, keeping it open for now or restricted.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.G1]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    team = db.query(TeamModel).filter(TeamModel.name == team_in.name).first()
    if team:
        raise HTTPException(status_code=400, detail="Team already exists")
    
    team = TeamModel(name=team_in.name, description=team_in.description)
    db.add(team)
    db.commit()
    db.refresh(team)
    return team
