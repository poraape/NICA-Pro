from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Literal

Sex = Literal["male", "female", "other"]
ActivityLevel = Literal["sedentary", "light", "moderate", "intense"]
Goal = Literal["cut", "maintain", "bulk"]


@dataclass(slots=True)
class UserProfile:
    name: str
    age: int
    weight_kg: float
    height_cm: float
    sex: Sex
    activity_level: ActivityLevel
    goal: Goal
    systolic_bp: int
    diastolic_bp: int
    sodium_mg: int
    allergies: list[str] = field(default_factory=list)
    comorbidities: list[str] = field(default_factory=list)
    bmi: float | None = None


@dataclass(slots=True)
class FoodPortion:
    label: str
    quantity: float
    unit: str


@dataclass(slots=True)
class MealEntry:
    timestamp: datetime
    description: str
    items: list[FoodPortion] = field(default_factory=list)


@dataclass(slots=True)
class DailyLog:
    user: str
    date: datetime
    meals: list[MealEntry]


@dataclass(slots=True)
class MacroBreakdown:
    calories: float
    protein_g: float
    carbs_g: float
    fats_g: float


@dataclass(slots=True)
class MicroBreakdown:
    fiber_g: float
    omega3_mg: float
    iron_mg: float
    calcium_mg: float
    sodium_mg: float


@dataclass(slots=True)
class HydrationPlan:
    total_liters: float
    reminders: list[str]


@dataclass(slots=True)
class MealPlanEntry:
    label: str
    time: str
    items: list[str]
    calories: float
    protein_g: float
    carbs_g: float
    fats_g: float
    micros: list[str]
    justification: str


@dataclass(slots=True)
class NutritionPlanDay:
    day: str
    meals: list[MealPlanEntry]
    summary: MacroBreakdown
    hydration_ml: int


@dataclass(slots=True)
class CaloricTarget:
    tmb: float
    get: float
    adjustment_kcal: float
    target_calories: float


@dataclass(slots=True)
class ShoppingCategory:
    name: str
    items: list[str]


@dataclass(slots=True)
class SubstitutionOption:
    item: str
    substitution_1: str
    substitution_2: str
    equivalence: str


@dataclass(slots=True)
class NutritionPlan:
    user: str
    disclaimers: list[str]
    caloric_profile: CaloricTarget
    days: list[NutritionPlanDay]
    macro_targets: MacroBreakdown
    micro_targets: MicroBreakdown
    hydration: HydrationPlan
    shopping_list: list[ShoppingCategory]
    meal_prep: list[str]
    substitutions: list[SubstitutionOption]
    free_meal: str
    adherence_tips: list[str]
    follow_up_questions: list[str]


@dataclass(slots=True)
class TrendInsight:
    pattern: str
    signal: str
    projection: str


@dataclass(slots=True)
class CoachingMessage:
    title: str
    body: str
    severity: Literal["info", "success", "warning", "critical"]


@dataclass(slots=True)
class DashboardChart:
    type: Literal["radar", "pie", "bar", "timeline"]
    title: str
    data: dict[str, Any]


@dataclass(slots=True)
class DashboardCard:
    label: str
    value: str
    delta: str
    positive: bool


@dataclass(slots=True)
class ProgressMetric:
    label: str
    current: float
    target: float
    unit: str
    color: str
    icon: str


@dataclass(slots=True)
class TodayOverview:
    metrics: list[ProgressMetric]
    micronutrients: list[str]
    hydration: ProgressMetric
    insights: list[str]


@dataclass(slots=True)
class WeeklyDayStat:
    day: str
    calories: float
    status: Literal["above", "target", "below"]


@dataclass(slots=True)
class WeekSection:
    bars: list[WeeklyDayStat]
    trend_line: list[float]
    highlights: list[str]


@dataclass(slots=True)
class MealInspection:
    name: str
    time: str
    calories: float
    protein_g: float
    carbs_g: float
    fats_g: float
    impact: str
    adjustment: str


@dataclass(slots=True)
class DashboardAlert:
    title: str
    detail: str
    severity: Literal["info", "success", "warning", "critical"]


@dataclass(slots=True)
class NavigationLink:
    label: str
    description: str
    icon: str
    href: str


@dataclass(slots=True)
class DashboardState:
    user: str
    cards: list[DashboardCard]
    charts: list[DashboardChart]
    coach_messages: list[CoachingMessage]
    today: TodayOverview
    week: WeekSection
    meal_insights: list[MealInspection]
    alerts: list[DashboardAlert]
    navigation: list[NavigationLink]
    last_updated: datetime


@dataclass(slots=True)
class OrchestratorPayload:
    profile: UserProfile
    log: DailyLog | None = None
