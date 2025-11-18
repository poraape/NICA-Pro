"""Pydantic schemas for user endpoints."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    timezone: str = Field(default="UTC")


class UserCreate(UserBase):
    auth_user_id: str
    onboarding_completed: bool = False
    metadata: dict = Field(default_factory=dict)


class UserRead(UserBase):
    id: str
    auth_user_id: str
    onboarding_completed: bool
    metadata: dict
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
