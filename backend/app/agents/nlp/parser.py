"""Lightweight NLP helpers for meal parsing and nutrition estimation."""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Iterable, List

DATA_PATH = Path(__file__).with_name("food_db.json")
UNIT_MAP = {
    "g": 1,
    "grama": 1,
    "gramas": 1,
    "ml": 1,
    "mililitro": 1,
    "mililitros": 1,
    "copo": 240,
    "copos": 240,
    "xícara": 240,
    "xicara": 240,
    "xícaras": 240,
    "xicaras": 240,
    "colher": 15,
    "colheres": 15,
}


@lru_cache
def _load_food_db() -> Dict[str, Dict[str, Any]]:
    with DATA_PATH.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def _match_quantity(text: str, alias: str, default: float) -> float:
    pattern = re.compile(
        rf"(?P<qty>\d+(?:[\.,]\d+)?)\s*(?P<unit>g|gramas?|ml|mililitros?|copo?s?|x[ií]caras?|colheres?)?\s*(?:de\s+)?{re.escape(alias)}",
        re.IGNORECASE,
    )
    match = pattern.search(text)
    if not match:
        return default

    raw_qty = match.group("qty").replace(",", ".")
    qty = float(raw_qty)
    unit = (match.group("unit") or "g").lower()
    unit = unit.replace("í", "i")  # normalize accents for lookup
    multiplier = UNIT_MAP.get(unit, 1)
    return qty * multiplier


def parse_meal_text(text: str) -> List[Dict[str, Any]]:
    """Extract known foods and estimate gram amounts for each."""
    normalized_text = text.lower()
    food_db = _load_food_db()
    parsed: List[Dict[str, Any]] = []

    for canonical_name, info in food_db.items():
        for alias in info.get("aliases", []):
            if alias in normalized_text:
                grams = _match_quantity(normalized_text, alias, info.get("default_grams", 100))
                parsed.append(_build_entry(canonical_name, alias, grams, info))
                break

    return parsed


def _build_entry(name: str, alias: str, grams: float, info: Dict[str, Any]) -> Dict[str, Any]:
    factor = grams / 100
    entry = {
        "food": name,
        "matched_alias": alias,
        "grams": round(grams, 2),
        "calories": round(info.get("calories_per_100g", 0) * factor, 2),
        "protein": round(info.get("protein_per_100g", 0) * factor, 2),
        "carbs": round(info.get("carbs_per_100g", 0) * factor, 2),
        "fat": round(info.get("fat_per_100g", 0) * factor, 2),
        "hydration": round(info.get("hydration_per_100g", 0) * factor, 2),
    }
    return entry


def compute_nutrition(parsed_foods: Iterable[Dict[str, Any]]) -> Dict[str, float]:
    totals = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "hydration": 0.0}
    for food in parsed_foods:
        for key in totals:
            totals[key] += float(food.get(key, 0) or 0)

    return {metric: round(value, 2) for metric, value in totals.items()}


__all__ = ["parse_meal_text", "compute_nutrition"]
