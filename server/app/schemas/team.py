from pydantic import BaseModel
from typing import Optional, List
from app.schemas.user import User

class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamUpdate(TeamBase):
    pass

class TeamInDBBase(TeamBase):
    id: int

    class Config:
        from_attributes = True

class Team(TeamInDBBase):
    members: List[User] = []
