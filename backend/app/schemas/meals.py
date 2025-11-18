"""Pydantic schemas for meal tracking."""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class MealBase(BaseModel):
    meal_time: datetime
    meal_type: Optional[str] = None
    plan_id: Optional[str] = None
    source: str = Field(default="user_entry")
    raw_input: Optional[str] = None
    normalized_items: list[dict[str, Any]] = Field(default_factory=list)
    calories: Optional[float] = Field(default=None, ge=0)
    protein: Optional[float] = Field(default=None, ge=0)
    carbs: Optional[float] = Field(default=None, ge=0)
    fat: Optional[float] = Field(default=None, ge=0)
    hydration: Optional[float] = Field(default=None, ge=0)
    inference_metadata: dict[str, Any] = Field(default_factory=dict)


class MealIngestRequest(BaseModel):
    meal_time: datetime
    meal_type: Optional[str] = None
    text: str = Field(..., min_length=3)
    emotion: Optional[str] = None
    plan_id: Optional[str] = None


class MealCreate(MealBase):
    pass


class MealRead(MealBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
