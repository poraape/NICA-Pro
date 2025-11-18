"""Schemas para os resumos diário/semanal e insights."""
from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class MacroTotals(BaseModel):
    calories: float = 0.0
    protein: float = 0.0
    carbs: float = 0.0
    fat: float = 0.0
    hydration: float = 0.0


class GoalSnapshot(BaseModel):
    calories_target: Optional[int] = None
    protein_target: Optional[float] = None
    carbs_target: Optional[float] = None
    fat_target: Optional[float] = None
    hydration_target: Optional[float] = None

    model_config = {"from_attributes": True}


class DailySummaryResponse(BaseModel):
    date: date
    totals: MacroTotals
    goal: Optional[GoalSnapshot] = None


class WeeklyDayBreakdown(BaseModel):
    date: date
    calories: float = 0.0
    protein: float = 0.0
    carbs: float = 0.0
    fat: float = 0.0


class WeeklySummaryResponse(BaseModel):
    week_start: date
    days: list[WeeklyDayBreakdown]
    goal: Optional[GoalSnapshot] = None


class InsightsResponse(BaseModel):
    insights: list[str] = Field(default_factory=list)
