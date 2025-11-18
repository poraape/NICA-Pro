"""Aggregate schema exports."""
from .user import UserCreate, UserRead
from .goals import GoalUpsert, GoalRead
from .meals import MealCreate, MealRead, MealIngestRequest
from .summary import (
    MacroTotals,
    GoalSnapshot,
    DailySummaryResponse,
    WeeklySummaryResponse,
    WeeklyDayBreakdown,
    InsightsResponse,
)

__all__ = [
    "UserCreate",
    "UserRead",
    "GoalUpsert",
    "GoalRead",
    "MealCreate",
    "MealRead",
    "MealIngestRequest",
    "MacroTotals",
    "GoalSnapshot",
    "DailySummaryResponse",
    "WeeklySummaryResponse",
    "WeeklyDayBreakdown",
    "InsightsResponse",
]
