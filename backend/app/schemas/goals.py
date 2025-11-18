"""Pydantic schemas for user goals."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class GoalBase(BaseModel):
    calories_target: int = Field(gt=0)
    protein_target: Optional[float] = Field(default=None, ge=0)
    carbs_target: Optional[float] = Field(default=None, ge=0)
    fat_target: Optional[float] = Field(default=None, ge=0)
    hydration_target: Optional[float] = Field(default=None, ge=0)


class GoalUpsert(GoalBase):
    effective_from: Optional[date] = None


class GoalRead(GoalBase):
    id: str
    active: bool
    effective_from: date
    effective_to: Optional[date] = None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
