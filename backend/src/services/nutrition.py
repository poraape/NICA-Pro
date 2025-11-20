from __future__ import annotations

from dataclasses import asdict
from typing import Any

from core.models import MacroBreakdown, MicroBreakdown, UserProfile

_ACTIVITY_FACTORS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "intense": 1.725,
}

_GOAL_ADJUSTMENTS = {
    "cut": -350,
    "maintain": 0,
    "bulk": 250,
}


def _bmr(profile: UserProfile) -> float:
    if profile.sex == "male":
        return 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age + 5
    return 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age - 161


def estimate_macro_targets(profile: UserProfile) -> MacroBreakdown:
    bmr = _bmr(profile)
    activity = _ACTIVITY_FACTORS[profile.activity_level]
    calories = bmr * activity + _GOAL_ADJUSTMENTS[profile.goal]
    protein = profile.weight_kg * 2.0
    fats = profile.weight_kg * 0.9
    carbs = (calories - (protein * 4 + fats * 9)) / 4
    return MacroBreakdown(
        calories=round(calories, 1),
        protein_g=round(protein, 1),
        carbs_g=round(max(carbs, 0), 1),
        fats_g=round(fats, 1),
    )


def estimate_micro_targets(profile: UserProfile) -> MicroBreakdown:
    sodium = 1500.0 if profile.goal == "cut" else 1800.0
    return MicroBreakdown(
        fiber_g=round(profile.weight_kg * 0.3, 1),
        omega3_mg=1200.0,
        iron_mg=18.0 if profile.sex == "female" else 12.0,
        calcium_mg=1200.0,
        sodium_mg=sodium,
    )


def hydration_goal(profile: UserProfile) -> float:
    return round(profile.weight_kg * 0.035, 2)


def nutritional_matrix(profile: UserProfile) -> dict[str, Any]:
    macros = estimate_macro_targets(profile)
    micros = estimate_micro_targets(profile)
    hydration = hydration_goal(profile)
    return {
        "macros": asdict(macros),
        "micros": asdict(micros),
        "hydration_l": hydration,
    }
