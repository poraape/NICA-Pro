"""Meal endpoints."""
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app import models
from app.agents.nlp import compute_nutrition, parse_meal_text
from app.api.deps import DbSession, get_current_user
from app.schemas import MealIngestRequest, MealRead

router = APIRouter(prefix="/api/meals", tags=["meals"])


@router.post("", response_model=MealRead, status_code=201)
def create_meal(payload: MealIngestRequest, db: DbSession, current_user: models.User = Depends(get_current_user)):
    parsed_foods = parse_meal_text(payload.text)
    totals = compute_nutrition(parsed_foods)

    meal = models.Meal(
        user_id=current_user.id,
        meal_time=payload.meal_time,
        meal_type=payload.meal_type,
        plan_id=payload.plan_id,
        source="user_entry",
        raw_input=payload.text,
        normalized_items=parsed_foods,
        calories=totals.get("calories"),
        protein=totals.get("protein"),
        carbs=totals.get("carbs"),
        fat=totals.get("fat"),
        hydration=totals.get("hydration"),
        inference_metadata={
            "engine": "regex_v1",
            "emotion": payload.emotion,
            "food_count": len(parsed_foods),
        },
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return meal


@router.get("", response_model=list[MealRead])
def list_meals(
    db: DbSession,
    date_filter: Optional[date] = Query(default=None, alias="date"),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Meal).filter(models.Meal.user_id == current_user.id)
    if date_filter:
        day_start = datetime.combine(date_filter, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        query = query.filter(models.Meal.meal_time >= day_start, models.Meal.meal_time < day_end)
    return query.order_by(models.Meal.meal_time.asc()).all()
