from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.UNIT
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str
    team_id: Optional[int] = None

class UserUpdate(UserBase):
    password: Optional[str] = None
    team_id: Optional[int] = None

class UserInDBBase(UserBase):
    id: int
    team_id: Optional[int] = None

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str
