from __future__ import annotations

from ..core.models import UserProfile


def validate_profile(profile: UserProfile) -> None:
    if profile.age < 18:
        raise ValueError("NICA-Pro atende apenas maiores de idade")
    if profile.weight_kg <= 0 or profile.height_cm <= 0:
        raise ValueError("Peso e altura devem ser positivos")
