from __future__ import annotations

from asyncio import sleep
from dataclasses import replace
from typing import Mapping

from ..core.models import (
    ActivityLevel,
    DailyLog,
    Goal,
    MacroBreakdown,
    MicroBreakdown,
    Sex,
    UserProfile,
)
from ..core.serialization import (
    log_from_json,
    macro_to_json,
    micro_to_json,
    plan_from_json,
    profile_from_json,
)
from .base import BaseAgent, JSONDict

_ACTIVITY_FACTORS: dict[ActivityLevel, float] = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "intense": 1.725,
}

_GOAL_DRIVERS: dict[Goal, float] = {"cut": -0.15, "maintain": 0.0, "bulk": 0.12}

_CATEGORY_MACROS: dict[str, dict[str, float]] = {
    "protein": {"calories": 4.1, "protein_g": 1.0, "carbs_g": 0.05, "fats_g": 0.02},
    "carb": {"calories": 3.9, "protein_g": 0.06, "carbs_g": 0.8, "fats_g": 0.02},
    "fat": {"calories": 8.8, "protein_g": 0.02, "carbs_g": 0.02, "fats_g": 1.0},
    "mixed": {"calories": 5.0, "protein_g": 0.2, "carbs_g": 0.5, "fats_g": 0.1},
}

_CATEGORY_MICROS: dict[str, dict[str, float]] = {
    "protein": {
        "fiber_g": 0.01,
        "omega3_mg": 60,
        "iron_mg": 0.12,
        "calcium_mg": 5,
        "sodium_mg": 4,
    },
    "carb": {
        "fiber_g": 0.07,
        "omega3_mg": 20,
        "iron_mg": 0.05,
        "calcium_mg": 2,
        "sodium_mg": 1.5,
    },
    "fat": {
        "fiber_g": 0.0,
        "omega3_mg": 90,
        "iron_mg": 0.02,
        "calcium_mg": 1,
        "sodium_mg": 2,
    },
    "mixed": {
        "fiber_g": 0.04,
        "omega3_mg": 45,
        "iron_mg": 0.08,
        "calcium_mg": 4,
        "sodium_mg": 3,
    },
}

_UNIT_TO_GRAMS = {
    "g": 1.0,
    "gram": 1.0,
    "grams": 1.0,
    "kg": 1000.0,
    "ml": 1.0,
    "l": 1000.0,
    "oz": 28.3495,
    "lb": 453.592,
    "cup": 240.0,
    "tbsp": 15.0,
    "tsp": 5.0,
    "slice": 30.0,
    "unit": 75.0,
}

_SAFE_CALORIES = (1100.0, 4800.0)


def mifflin_st_jeor(weight_kg: float, height_cm: float, age: int, sex: Sex) -> float:
    """Return basal metabolic rate using the Mifflin-St Jeor equation."""

    base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    if sex == "male":
        return base + 5
    if sex == "female":
        return base - 161
    return base - 78  # neutral offset for unspecified cases


def total_energy_expenditure(bmr: float, activity: ActivityLevel) -> float:
    """Calculate GET (TDEE) based on activity multiplier."""

    return bmr * _ACTIVITY_FACTORS[activity]


def goal_adjusted_calories(tdee: float, goal: Goal) -> float:
    """Apply goal-based adjustment percentage to TDEE to define caloric target."""

    return tdee * (1 + _GOAL_DRIVERS[goal])


def compute_macro_targets(calories: float, weight_kg: float, goal: Goal) -> MacroBreakdown:
    """Derive macro targets from calorie goal and body weight."""

    protein_factor = 2.0 if goal == "bulk" else 1.6
    protein = weight_kg * protein_factor
    fats = max(weight_kg * 0.8, calories * 0.2 / 9)
    carbs = max((calories - (protein * 4 + fats * 9)) / 4, 0)
    return MacroBreakdown(
        calories=round(calories, 1),
        protein_g=round(protein, 1),
        carbs_g=round(carbs, 1),
        fats_g=round(fats, 1),
    )


def compute_micro_targets(profile: UserProfile) -> MicroBreakdown:
    """Estimate micronutrient targets based on sex and age."""

    iron = 18.0 if profile.sex == "female" and profile.age < 50 else 12.0
    calcium = 1300.0 if profile.age < 20 else 1000.0
    fiber = max(profile.weight_kg * 0.35, 25.0)
    omega3 = 1600.0 if profile.sex == "male" else 1100.0
    sodium = 1500.0 if profile.goal == "cut" else 1800.0
    return MicroBreakdown(
        fiber_g=round(fiber, 1),
        omega3_mg=round(omega3, 0),
        iron_mg=round(iron, 1),
        calcium_mg=round(calcium, 1),
        sodium_mg=round(sodium, 1),
    )


def normalize_quantity(quantity: float, unit: str) -> float:
    """Normalize different food units to grams for uniform calculations."""

    return quantity * _UNIT_TO_GRAMS.get(unit.lower(), 100.0)


def classify_food(label: str) -> str:
    """Classify food descriptions into macro-dominant categories."""

    name = label.lower()
    if any(keyword in name for keyword in ["chicken", "fish", "egg", "tofu", "beef", "protein"]):
        return "protein"
    if any(keyword in name for keyword in ["rice", "bread", "fruit", "pasta", "oat", "carb"]):
        return "carb"
    if any(keyword in name for keyword in ["avocado", "oil", "nuts", "seed", "butter"]):
        return "fat"
    return "mixed"


def add_macros(base: MacroBreakdown, delta: MacroBreakdown) -> MacroBreakdown:
    """Add two macro structures and return the sum."""

    return MacroBreakdown(
        calories=base.calories + delta.calories,
        protein_g=base.protein_g + delta.protein_g,
        carbs_g=base.carbs_g + delta.carbs_g,
        fats_g=base.fats_g + delta.fats_g,
    )


def add_micros(base: MicroBreakdown, delta: MicroBreakdown) -> MicroBreakdown:
    """Add two micro structures and return the sum."""

    return MicroBreakdown(
        fiber_g=base.fiber_g + delta.fiber_g,
        omega3_mg=base.omega3_mg + delta.omega3_mg,
        iron_mg=base.iron_mg + delta.iron_mg,
        calcium_mg=base.calcium_mg + delta.calcium_mg,
        sodium_mg=base.sodium_mg + delta.sodium_mg,
    )


def macros_from_food(category: str, grams: float) -> MacroBreakdown:
    """Estimate macros for a portion based on its category."""

    density = _CATEGORY_MACROS[category]
    return MacroBreakdown(
        calories=grams * density["calories"],
        protein_g=grams * density["protein_g"],
        carbs_g=grams * density["carbs_g"],
        fats_g=grams * density["fats_g"],
    )


def micros_from_food(category: str, grams: float) -> MicroBreakdown:
    """Estimate micronutrients for a portion based on its category."""

    density = _CATEGORY_MICROS[category]
    return MicroBreakdown(
        fiber_g=grams * density["fiber_g"],
        omega3_mg=grams * density["omega3_mg"],
        iron_mg=grams * density["iron_mg"],
        calcium_mg=grams * density["calcium_mg"],
        sodium_mg=grams * density["sodium_mg"],
    )


def estimate_macro_intake(log: DailyLog | None) -> MacroBreakdown:
    """Estimate macro intake for a diary log."""

    totals = MacroBreakdown(0.0, 0.0, 0.0, 0.0)
    if not log:
        return totals
    for meal in log.meals:
        for item in meal.items:
            grams = normalize_quantity(item.quantity, item.unit)
            category = classify_food(item.label)
            totals = add_macros(totals, macros_from_food(category, grams))
    return MacroBreakdown(
        calories=round(totals.calories, 1),
        protein_g=round(totals.protein_g, 1),
        carbs_g=round(totals.carbs_g, 1),
        fats_g=round(totals.fats_g, 1),
    )


def estimate_micro_intake(log: DailyLog | None) -> MicroBreakdown:
    """Estimate micronutrient intake for a diary log."""

    totals = MicroBreakdown(0.0, 0.0, 0.0, 0.0, 0.0)
    if not log:
        return totals
    for meal in log.meals:
        for item in meal.items:
            grams = normalize_quantity(item.quantity, item.unit)
            category = classify_food(item.label)
            totals = add_micros(totals, micros_from_food(category, grams))
    return MicroBreakdown(
        fiber_g=round(totals.fiber_g, 1),
        omega3_mg=round(totals.omega3_mg, 1),
        iron_mg=round(totals.iron_mg, 1),
        calcium_mg=round(totals.calcium_mg, 1),
        sodium_mg=round(totals.sodium_mg, 1),
    )


def hydration_from_log(log: DailyLog | None, fallback: float) -> float:
    """Estimate hydration from liquid items while respecting a fallback target."""

    if not log:
        return round(fallback * 0.6, 2)
    liters = 0.0
    for meal in log.meals:
        for item in meal.items:
            unit = item.unit.lower()
            if unit in {"ml", "l", "cup"} or "water" in item.label.lower():
                liters += normalize_quantity(item.quantity, item.unit) / 1000
    return round(max(liters, fallback * 0.5), 2)


def apply_clinical_adjustments(
    macros: MacroBreakdown, adjustments: Mapping[str, float] | None
) -> MacroBreakdown:
    """Apply clinical overrides (e.g., renal protocols) without mutating inputs."""

    if not adjustments:
        return macros
    return MacroBreakdown(
        calories=max(macros.calories + adjustments.get("calories", 0.0), _SAFE_CALORIES[0]),
        protein_g=max(macros.protein_g + adjustments.get("protein_g", 0.0), 0.0),
        carbs_g=max(macros.carbs_g + adjustments.get("carbs_g", 0.0), 0.0),
        fats_g=max(macros.fats_g + adjustments.get("fats_g", 0.0), 0.0),
    )


def weekly_projection(macros: MacroBreakdown, hydration_l: float) -> dict[str, float]:
    """Project weekly totals for macros and hydration."""

    return {
        "calories": round(macros.calories * 7, 1),
        "protein_g": round(macros.protein_g * 7, 1),
        "carbs_g": round(macros.carbs_g * 7, 1),
        "fats_g": round(macros.fats_g * 7, 1),
        "hydration_l": round(hydration_l * 7, 2),
    }


def validate_ranges(
    macros: MacroBreakdown,
    targets: MacroBreakdown,
    micros: MicroBreakdown,
    micro_targets: MicroBreakdown,
    hydration_actual: float,
    hydration_target: float,
) -> list[str]:
    """Validate intake ranges and emit human-readable alerts."""

    alerts: list[str] = []
    if macros.calories < _SAFE_CALORIES[0]:
        alerts.append("Calorias abaixo do recomendado clinicamente.")
    if macros.calories > _SAFE_CALORIES[1]:
        alerts.append("Calorias acima do limite seguro diário.")
    if macros.protein_g < targets.protein_g * 0.7:
        alerts.append("Proteína muito baixa vs meta.")
    if macros.carbs_g > targets.carbs_g * 1.4:
        alerts.append("Carboidratos excederam o limite planejado.")
    if micros.fiber_g < micro_targets.fiber_g * 0.6:
        alerts.append("Fibra insuficiente para saúde intestinal.")
    if hydration_actual < hydration_target * 0.8:
        alerts.append("Hidratação ficou abaixo do esperado.")
    if micros.sodium_mg > 2000:
        alerts.append("Sódio ultrapassou 2000 mg no dia.")
    return alerts


class CalcAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("Calc-Agent")

    async def run(self, payload: JSONDict) -> JSONDict:
        await sleep(0)
        plan = plan_from_json(payload["plan"])
        profile = (
            profile_from_json(payload["profile"])
            if payload.get("profile")
            else None
        )
        log_data = payload.get("log")
        log = log_from_json(log_data) if log_data else None
        clinical_adjustments: Mapping[str, float] | None = payload.get("clinical_adjustments")

        bmr = (
            mifflin_st_jeor(profile.weight_kg, profile.height_cm, profile.age, profile.sex)
            if profile
            else plan.macro_targets.calories / _ACTIVITY_FACTORS["moderate"]
        )
        tdee = total_energy_expenditure(bmr, profile.activity_level if profile else "moderate")
        calorie_goal = goal_adjusted_calories(tdee, profile.goal if profile else "maintain")
        macro_targets = (
            compute_macro_targets(calorie_goal, profile.weight_kg, profile.goal)
            if profile
            else plan.macro_targets
        )
        micro_targets = compute_micro_targets(profile) if profile else plan.micro_targets

        macros_actual = estimate_macro_intake(log)
        macros_adjusted = apply_clinical_adjustments(macros_actual, clinical_adjustments)
        macros_final = replace(macros_adjusted, calories=round(macros_adjusted.calories, 1))
        micros_actual = estimate_micro_intake(log)
        hydration_actual = hydration_from_log(log, plan.hydration.total_liters)

        alerts = validate_ranges(
            macros_final,
            macro_targets,
            micros_actual,
            micro_targets,
            hydration_actual,
            plan.hydration.total_liters,
        )

        return {
            "macros": macro_to_json(macros_final),
            "micros": micro_to_json(micros_actual),
            "hydration_l": hydration_actual,
            "metabolism": {
                "bmr_tmb": round(bmr, 1),
                "tdee_get": round(tdee, 1),
                "calorie_goal": round(calorie_goal, 1),
            },
            "targets": {
                "macros": macro_to_json(macro_targets),
                "micros": micro_to_json(micro_targets),
            },
            "weekly_projection": weekly_projection(macros_final, hydration_actual),
            "alerts": alerts,
        }
