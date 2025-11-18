"""Goal management endpoints."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.api.deps import DbSession, get_current_user
from app.schemas import GoalRead, GoalUpsert

router = APIRouter(prefix="/api/goals", tags=["goals"])


def _get_active_goal(db: Session, user_id: str):
    return (
        db.query(models.UserGoal)
        .filter(models.UserGoal.user_id == user_id)
        .order_by(models.UserGoal.effective_from.desc())
        .first()
    )


@router.get("", response_model=GoalRead)
def get_goal(db: DbSession, current_user: models.User = Depends(get_current_user)):
    goal = _get_active_goal(db, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not configured")
    return goal


@router.put("", response_model=GoalRead)
def update_goal(payload: GoalUpsert, db: DbSession, current_user: models.User = Depends(get_current_user)):
    active_goal = _get_active_goal(db, current_user.id)
    if active_goal:
        active_goal.active = False
        active_goal.effective_to = payload.effective_from or date.today()

    new_goal = models.UserGoal(
        user_id=current_user.id,
        effective_from=payload.effective_from or date.today(),
        **payload.model_dump(exclude={"effective_from"})
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return new_goal
