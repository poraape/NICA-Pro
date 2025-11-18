"""User endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status

from app import models
from app.api.deps import DbSession, get_current_user
from app.schemas import UserCreate, UserRead

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: DbSession):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    user = models.User(**payload.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserRead)
def get_current_user_profile(current_user: models.User = Depends(get_current_user)):
    return current_user
