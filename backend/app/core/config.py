"""Application configuration and settings helpers."""
from functools import lru_cache
from pydantic import BaseModel, Field
import os


class Settings(BaseModel):
    """Runtime configuration derived from environment variables."""

    database_url: str = Field(default_factory=lambda: os.getenv("DATABASE_URL", "sqlite:///./nica.db"))


@lru_cache
def get_settings() -> Settings:
    return Settings()
