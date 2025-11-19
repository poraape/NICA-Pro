from __future__ import annotations

from datetime import datetime
from typing import Iterable

from ..core.models import FoodPortion, MealEntry

_UNIT_MAP = {
    "g": 1.0,
    "gram": 1.0,
    "grams": 1.0,
    "kg": 1000.0,
    "ml": 1.0,
    "l": 1000.0,
}


def normalize_portion(label: str, quantity: float, unit: str) -> FoodPortion:
    unit_key = unit.lower()
    grams = quantity * _UNIT_MAP.get(unit_key, 1.0)
    normalized_unit = "g" if unit_key in {"g", "gram", "grams", "kg"} else unit
    return FoodPortion(label=label.title(), quantity=grams, unit=normalized_unit)


def normalize_entries(entries: Iterable[MealEntry]) -> list[MealEntry]:
    normalized: list[MealEntry] = []
    for entry in entries:
        items = [normalize_portion(i.label, i.quantity, i.unit) for i in entry.items]
        normalized.append(
            MealEntry(
                timestamp=entry.timestamp if entry.timestamp else datetime.utcnow(),
                description=entry.description.strip(),
                items=items,
            )
        )
    return normalized
