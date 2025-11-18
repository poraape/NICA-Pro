"""Endpoints de resumo diário, semanal e insights."""
from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Dict, Iterable

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func

from app import models
from app.agents.coach import generate_insights
from app.api.deps import DbSession, get_current_user
from app.schemas import (
    DailySummaryResponse,
    GoalSnapshot,
    InsightsResponse,
    MacroTotals,
    WeeklyDayBreakdown,
    WeeklySummaryResponse,
)

router = APIRouter(prefix="/api/summary", tags=["summary"])


def _get_goal_snapshot(db: DbSession, user_id: str) -> GoalSnapshot | None:
    goal = (
        db.query(models.UserGoal)
        .filter(models.UserGoal.user_id == user_id)
        .order_by(models.UserGoal.effective_from.desc())
        .first()
    )
    return GoalSnapshot.model_validate(goal) if goal else None


def _range_bounds(target_date: date) -> tuple[datetime, datetime]:
    start = datetime.combine(target_date, datetime.min.time())
    end = start + timedelta(days=1)
    return start, end


def _row_to_totals(row: Iterable) -> MacroTotals:
    if not row:
        return MacroTotals()
    calories, protein, carbs, fat, hydration = row
    return MacroTotals(
        calories=float(calories or 0),
        protein=float(protein or 0),
        carbs=float(carbs or 0),
        fat=float(fat or 0),
        hydration=float(hydration or 0),
    )


@router.get("/daily", response_model=DailySummaryResponse)
def get_daily_summary(
    db: DbSession,
    date_filter: date | None = Query(default=None, alias="date"),
    current_user: models.User = Depends(get_current_user),
):
    target_date = date_filter or date.today()
    start, end = _range_bounds(target_date)

    totals_row = (
        db.query(
            func.coalesce(func.sum(models.Meal.calories), 0),
            func.coalesce(func.sum(models.Meal.protein), 0),
            func.coalesce(func.sum(models.Meal.carbs), 0),
            func.coalesce(func.sum(models.Meal.fat), 0),
            func.coalesce(func.sum(models.Meal.hydration), 0),
        )
        .filter(models.Meal.user_id == current_user.id)
        .filter(models.Meal.meal_time >= start, models.Meal.meal_time < end)
        .first()
    )

    totals = _row_to_totals(totals_row)
    goal = _get_goal_snapshot(db, current_user.id)
    return DailySummaryResponse(date=target_date, totals=totals, goal=goal)


@router.get("/weekly", response_model=WeeklySummaryResponse)
def get_weekly_summary(
    db: DbSession,
    week_start: date | None = Query(default=None, alias="week_start"),
    current_user: models.User = Depends(get_current_user),
):
    today = date.today()
    base_start = week_start or (today - timedelta(days=today.weekday()))
    start_dt, _ = _range_bounds(base_start)
    end_dt = start_dt + timedelta(days=7)

    grouped_rows = (
        db.query(
            func.date(models.Meal.meal_time).label("day"),
            func.coalesce(func.sum(models.Meal.calories), 0).label("calories"),
            func.coalesce(func.sum(models.Meal.protein), 0).label("protein"),
            func.coalesce(func.sum(models.Meal.carbs), 0).label("carbs"),
            func.coalesce(func.sum(models.Meal.fat), 0).label("fat"),
        )
        .filter(models.Meal.user_id == current_user.id)
        .filter(models.Meal.meal_time >= start_dt, models.Meal.meal_time < end_dt)
        .group_by("day")
        .all()
    )

    rows_by_day: Dict[date, WeeklyDayBreakdown] = {}
    for row in grouped_rows:
        rows_by_day[row.day] = WeeklyDayBreakdown(
            date=row.day,
            calories=float(row.calories or 0),
            protein=float(row.protein or 0),
            carbs=float(row.carbs or 0),
            fat=float(row.fat or 0),
        )

    days: list[WeeklyDayBreakdown] = []
    for offset in range(7):
        day = base_start + timedelta(days=offset)
        days.append(rows_by_day.get(day) or WeeklyDayBreakdown(date=day))

    goal = _get_goal_snapshot(db, current_user.id)
    return WeeklySummaryResponse(week_start=base_start, days=days, goal=goal)


@router.get("/insights", response_model=InsightsResponse)
def get_insights(db: DbSession, current_user: models.User = Depends(get_current_user)):
    today = date.today()
    start, end = _range_bounds(today)
    totals_row = (
        db.query(
            func.coalesce(func.sum(models.Meal.calories), 0),
            func.coalesce(func.sum(models.Meal.protein), 0),
            func.coalesce(func.sum(models.Meal.carbs), 0),
            func.coalesce(func.sum(models.Meal.fat), 0),
            func.coalesce(func.sum(models.Meal.hydration), 0),
        )
        .filter(models.Meal.user_id == current_user.id)
        .filter(models.Meal.meal_time >= start, models.Meal.meal_time < end)
        .first()
    )
    totals = _row_to_totals(totals_row)
    goal = _get_goal_snapshot(db, current_user.id)

    recent_start = today - timedelta(days=6)
    recent_rows = (
        db.query(
            func.date(models.Meal.meal_time).label("day"),
            func.coalesce(func.sum(models.Meal.calories), 0).label("calories"),
        )
        .filter(models.Meal.user_id == current_user.id)
        .filter(models.Meal.meal_time >= datetime.combine(recent_start, datetime.min.time()))
        .filter(models.Meal.meal_time < end)
        .group_by("day")
        .order_by("day")
        .all()
    )
    history = [
        {"date": row.day, "calories": float(row.calories or 0)}
        for row in recent_rows
    ]

    messages = generate_insights(goal, totals, history)
    return InsightsResponse(insights=messages)
