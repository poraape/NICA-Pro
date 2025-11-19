from __future__ import annotations

from dataclasses import asdict
from datetime import datetime
from typing import Any

from .models import (
    CaloricTarget,
    CoachingMessage,
    DailyLog,
    DashboardAlert,
    DashboardCard,
    DashboardChart,
    DashboardState,
    FoodPortion,
    HydrationPlan,
    MacroBreakdown,
    MealEntry,
    MealInspection,
    MealPlanEntry,
    MicroBreakdown,
    NavigationLink,
    NutritionPlan,
    NutritionPlanDay,
    ProgressMetric,
    ShoppingCategory,
    SubstitutionOption,
    TodayOverview,
    TrendInsight,
    UserProfile,
    WeekSection,
    WeeklyDayStat,
)

JSONDict = dict[str, Any]


def _iso(dt: datetime | str) -> str:
    return dt if isinstance(dt, str) else dt.isoformat()


def _parse_datetime(value: str | datetime) -> datetime:
    return value if isinstance(value, datetime) else datetime.fromisoformat(value)


def profile_to_json(profile: UserProfile) -> JSONDict:
    return asdict(profile)


def profile_from_json(data: JSONDict) -> UserProfile:
    return UserProfile(**data)


def macro_to_json(macros: MacroBreakdown) -> JSONDict:
    return asdict(macros)


def macro_from_json(data: JSONDict) -> MacroBreakdown:
    return MacroBreakdown(**data)


def micro_to_json(micros: MicroBreakdown) -> JSONDict:
    return asdict(micros)


def micro_from_json(data: JSONDict) -> MicroBreakdown:
    return MicroBreakdown(
        fiber_g=float(data.get("fiber_g", 0.0)),
        omega3_mg=float(data.get("omega3_mg", 0.0)),
        iron_mg=float(data.get("iron_mg", 0.0)),
        calcium_mg=float(data.get("calcium_mg", 0.0)),
        sodium_mg=float(data.get("sodium_mg", 0.0)),
    )


def _meal_entry_to_json(entry: MealPlanEntry) -> JSONDict:
    return {
        "label": entry.label,
        "time": entry.time,
        "items": entry.items,
        "calories": entry.calories,
        "protein_g": entry.protein_g,
        "carbs_g": entry.carbs_g,
        "fats_g": entry.fats_g,
        "micros": entry.micros,
        "justification": entry.justification,
    }


def _meal_entry_from_json(data: JSONDict) -> MealPlanEntry:
    return MealPlanEntry(
        label=data["label"],
        time=data["time"],
        items=list(data.get("items", [])),
        calories=float(data["calories"]),
        protein_g=float(data["protein_g"]),
        carbs_g=float(data["carbs_g"]),
        fats_g=float(data["fats_g"]),
        micros=list(data.get("micros", [])),
        justification=data["justification"],
    )


def _day_from_json(data: JSONDict) -> NutritionPlanDay:
    return NutritionPlanDay(
        day=data["day"],
        meals=[_meal_entry_from_json(meal) for meal in data.get("meals", [])],
        summary=macro_from_json(data["summary"]),
        hydration_ml=int(data["hydration_ml"]),
    )


def _shopping_category_to_json(category: ShoppingCategory) -> JSONDict:
    return {"name": category.name, "items": category.items}


def _shopping_category_from_json(data: JSONDict) -> ShoppingCategory:
    return ShoppingCategory(name=data["name"], items=list(data.get("items", [])))


def _substitution_to_json(option: SubstitutionOption) -> JSONDict:
    return asdict(option)


def _substitution_from_json(data: JSONDict) -> SubstitutionOption:
    return SubstitutionOption(**data)


def plan_to_json(plan: NutritionPlan) -> JSONDict:
    return {
        "user": plan.user,
        "disclaimers": plan.disclaimers,
        "caloric_profile": asdict(plan.caloric_profile),
        "days": [
            {
                "day": day.day,
                "meals": [_meal_entry_to_json(meal) for meal in day.meals],
                "summary": macro_to_json(day.summary),
                "hydration_ml": day.hydration_ml,
            }
            for day in plan.days
        ],
        "macro_targets": macro_to_json(plan.macro_targets),
        "micro_targets": micro_to_json(plan.micro_targets),
        "hydration": asdict(plan.hydration),
        "shopping_list": [_shopping_category_to_json(cat) for cat in plan.shopping_list],
        "meal_prep": list(plan.meal_prep),
        "substitutions": [_substitution_to_json(opt) for opt in plan.substitutions],
        "free_meal": plan.free_meal,
        "adherence_tips": list(plan.adherence_tips),
        "follow_up_questions": list(plan.follow_up_questions),
    }


def plan_from_json(data: JSONDict) -> NutritionPlan:
    caloric_data = data.get("caloric_profile")
    if not caloric_data:
        macro_data = data.get("macro_targets", {})
        calories = float(macro_data.get("calories", 0))
        caloric_data = {
            "tmb": calories,
            "get": calories,
            "adjustment_kcal": 0.0,
            "target_calories": calories,
        }
    return NutritionPlan(
        user=data["user"],
        disclaimers=list(data.get("disclaimers", [])),
        caloric_profile=CaloricTarget(**caloric_data),
        days=[_day_from_json(day) for day in data.get("days", [])],
        macro_targets=macro_from_json(data["macro_targets"]),
        micro_targets=micro_from_json(data["micro_targets"]),
        hydration=HydrationPlan(**data["hydration"]),
        shopping_list=[
            _shopping_category_from_json(cat) for cat in data.get("shopping_list", [])
        ],
        meal_prep=list(data.get("meal_prep", [])),
        substitutions=[
            _substitution_from_json(opt) for opt in data.get("substitutions", [])
        ],
        free_meal=data.get("free_meal", ""),
        adherence_tips=list(data.get("adherence_tips", [])),
        follow_up_questions=list(data.get("follow_up_questions", [])),
    )


def food_portion_to_json(portion: FoodPortion) -> JSONDict:
    return asdict(portion)


def food_portion_from_json(data: JSONDict) -> FoodPortion:
    return FoodPortion(**data)


def meal_entry_to_json(meal: MealEntry) -> JSONDict:
    return {
        "timestamp": _iso(meal.timestamp),
        "description": meal.description,
        "items": [food_portion_to_json(item) for item in meal.items],
    }


def meal_entry_from_json(data: JSONDict) -> MealEntry:
    return MealEntry(
        timestamp=_parse_datetime(data["timestamp"]),
        description=data["description"],
        items=[food_portion_from_json(item) for item in data.get("items", [])],
    )


def log_to_json(log: DailyLog) -> JSONDict:
    return {
        "user": log.user,
        "date": _iso(log.date),
        "meals": [meal_entry_to_json(meal) for meal in log.meals],
    }


def log_from_json(data: JSONDict) -> DailyLog:
    return DailyLog(
        user=data["user"],
        date=_parse_datetime(data["date"]),
        meals=[meal_entry_from_json(meal) for meal in data.get("meals", [])],
    )


def trend_to_json(trend: TrendInsight) -> JSONDict:
    return asdict(trend)


def trend_from_json(data: JSONDict) -> TrendInsight:
    return TrendInsight(**data)


def coaching_to_json(message: CoachingMessage) -> JSONDict:
    return asdict(message)


def coaching_from_json(data: JSONDict) -> CoachingMessage:
    return CoachingMessage(**data)


def chart_to_json(chart: DashboardChart) -> JSONDict:
    return {"type": chart.type, "title": chart.title, "data": chart.data}


def chart_from_json(data: JSONDict) -> DashboardChart:
    return DashboardChart(type=data["type"], title=data["title"], data=data["data"])


def card_to_json(card: DashboardCard) -> JSONDict:
    return asdict(card)


def card_from_json(data: JSONDict) -> DashboardCard:
    return DashboardCard(**data)


def progress_to_json(metric: ProgressMetric) -> JSONDict:
    return asdict(metric)


def progress_from_json(data: JSONDict) -> ProgressMetric:
    return ProgressMetric(**data)


def today_to_json(today: TodayOverview) -> JSONDict:
    return {
        "metrics": [progress_to_json(metric) for metric in today.metrics],
        "micronutrients": list(today.micronutrients),
        "hydration": progress_to_json(today.hydration),
        "insights": list(today.insights),
    }


def today_from_json(data: JSONDict) -> TodayOverview:
    return TodayOverview(
        metrics=[progress_from_json(item) for item in data.get("metrics", [])],
        micronutrients=list(data.get("micronutrients", [])),
        hydration=progress_from_json(data["hydration"]),
        insights=list(data.get("insights", [])),
    )


def week_to_json(week: WeekSection) -> JSONDict:
    return {
        "bars": [
            {"day": bar.day, "calories": bar.calories, "status": bar.status}
            for bar in week.bars
        ],
        "trend_line": list(week.trend_line),
        "highlights": list(week.highlights),
    }


def week_from_json(data: JSONDict) -> WeekSection:
    return WeekSection(
        bars=[
            WeeklyDayStat(
                day=item["day"],
                calories=float(item.get("calories", 0.0)),
                status=item.get("status", "target"),
            )
            for item in data.get("bars", [])
        ],
        trend_line=[float(value) for value in data.get("trend_line", [])],
        highlights=list(data.get("highlights", [])),
    )


def meal_inspection_to_json(meal: MealInspection) -> JSONDict:
    return asdict(meal)


def meal_inspection_from_json(data: JSONDict) -> MealInspection:
    return MealInspection(
        name=data["name"],
        time=data["time"],
        calories=float(data.get("calories", 0.0)),
        protein_g=float(data.get("protein_g", 0.0)),
        carbs_g=float(data.get("carbs_g", 0.0)),
        fats_g=float(data.get("fats_g", 0.0)),
        impact=data.get("impact", ""),
        adjustment=data.get("adjustment", ""),
    )


def alert_to_json(alert: DashboardAlert) -> JSONDict:
    return asdict(alert)


def alert_from_json(data: JSONDict) -> DashboardAlert:
    return DashboardAlert(**data)


def navigation_to_json(link: NavigationLink) -> JSONDict:
    return asdict(link)


def navigation_from_json(data: JSONDict) -> NavigationLink:
    return NavigationLink(**data)


def dashboard_to_json(board: DashboardState) -> JSONDict:
    return {
        "user": board.user,
        "cards": [card_to_json(card) for card in board.cards],
        "charts": [chart_to_json(chart) for chart in board.charts],
        "coach_messages": [coaching_to_json(msg) for msg in board.coach_messages],
        "today": today_to_json(board.today),
        "week": week_to_json(board.week),
        "meal_insights": [
            meal_inspection_to_json(meal) for meal in board.meal_insights
        ],
        "alerts": [alert_to_json(alert) for alert in board.alerts],
        "navigation": [navigation_to_json(link) for link in board.navigation],
        "last_updated": _iso(board.last_updated),
    }


def dashboard_from_json(data: JSONDict) -> DashboardState:
    return DashboardState(
        user=data["user"],
        cards=[card_from_json(card) for card in data.get("cards", [])],
        charts=[chart_from_json(chart) for chart in data.get("charts", [])],
        coach_messages=[coaching_from_json(msg) for msg in data.get("coach_messages", [])],
        today=today_from_json(data["today"]),
        week=week_from_json(data["week"]),
        meal_insights=[
            meal_inspection_from_json(meal)
            for meal in data.get("meal_insights", [])
        ],
        alerts=[alert_from_json(alert) for alert in data.get("alerts", [])],
        navigation=[navigation_from_json(link) for link in data.get("navigation", [])],
        last_updated=_parse_datetime(data["last_updated"]),
    )
