from __future__ import annotations

from asyncio import sleep
from calendar import day_name
from dataclasses import replace
from typing import Any, Iterable

from core.models import (
    CaloricTarget,
    HydrationPlan,
    MealPlanEntry,
    MacroBreakdown,
    NutritionPlan,
    NutritionPlanDay,
    ShoppingCategory,
    SubstitutionOption,
    UserProfile,
)
from core.serialization import plan_to_json, profile_from_json
from services import nutrition
from .base import BaseAgent, JSONDict
from .substitution import SubstitutionPrepAgent


_WARNING = (
    "⚠️ AVISO IMPORTANTE:\n"
    "Este plano alimentar é apenas uma ferramenta educativa e não substitui avaliação por nutricionista ou médico. "
    "Não inicie mudanças intensas sem supervisão profissional."
)

_MEAL_ORDER = ["breakfast", "snack_am", "lunch", "snack_pm", "dinner"]

_MEAL_LIBRARY: dict[str, list[dict[str, Any]]] = {
    "breakfast": [
        {
            "label": "Café da Manhã",
            "time": "07:00",
            "items": [
                "Omelete com 2 ovos inteiros (100g) + espinafre (40g) + tomate (50g)",
                "Aveia em flocos (30g) hidratada com bebida vegetal sem açúcar (120ml)",
                "Sementes de chia (10g) e mirtilos frescos (40g)",
            ],
            "calories": 430,
            "protein_g": 30,
            "carbs_g": 38,
            "fats_g": 16,
            "micros": ["Ferro", "Folato", "Vitamina C"],
            "justification": "Proteínas de alto valor biológico e fibras estabilizam a glicemia matinal.",
        },
        {
            "label": "Café da Manhã",
            "time": "07:15",
            "items": [
                "Tapioca (40g) recheada com cottage (60g) e orégano",
                "Mamão papaia (150g) com linhaça dourada moída (15g)",
                "Castanhas-do-pará (2 un)",
            ],
            "calories": 410,
            "protein_g": 24,
            "carbs_g": 48,
            "fats_g": 12,
            "micros": ["Vitamina A", "Selênio", "Potássio"],
            "justification": "Combinação leve rica em fibras solúveis e gorduras boas para saciedade prolongada.",
        },
        {
            "label": "Café da Manhã",
            "time": "06:50",
            "items": [
                "Overnight oats com iogurte grego light (150g), aveia (35g), morangos (80g)",
                "Mel (5g) e canela a gosto",
                "Nozes picadas (15g)",
            ],
            "calories": 450,
            "protein_g": 28,
            "carbs_g": 52,
            "fats_g": 14,
            "micros": ["Cálcio", "Vitamina C", "Magnésio"],
            "justification": "Preparação prática rica em probióticos e antioxidantes para imunidade.",
        },
        {
            "label": "Café da Manhã",
            "time": "07:05",
            "items": [
                "Smoothie bowl com banana congelada (120g), espinafre (30g), proteína vegetal (20g) e bebida de coco (150ml)",
                "Granola sem açúcar (25g)",
                "Torrada integral (1 fatia) com pasta de amendoim (15g)",
            ],
            "calories": 460,
            "protein_g": 32,
            "carbs_g": 50,
            "fats_g": 17,
            "micros": ["Potássio", "Vitamina K", "Vitamina E"],
            "justification": "Fornece energia rápida, fibras e gorduras boas para treinos matinais.",
        },
    ],
    "snack_am": [
        {
            "label": "Lanche da Manhã",
            "time": "10:00",
            "items": [
                "Iogurte natural proteico (160g)",
                "Granola integral (20g)",
                "Frutas vermelhas (70g)",
            ],
            "calories": 230,
            "protein_g": 15,
            "carbs_g": 26,
            "fats_g": 7,
            "micros": ["Cálcio", "Vitamina C", "Probióticos"],
            "justification": "Suporte ao microbioma intestinal e aporte proteico intermediário.",
        },
        {
            "label": "Lanche da Manhã",
            "time": "10:30",
            "items": [
                "Maçã (140g)",
                "Pasta de amendoim natural (15g)",
                "Sementes de abóbora tostadas (15g)",
            ],
            "calories": 260,
            "protein_g": 10,
            "carbs_g": 28,
            "fats_g": 12,
            "micros": ["Zinco", "Vitamina E", "Fibras"],
            "justification": "Combinação crocante de baixo índice glicêmico e magnésio para foco.",
        },
        {
            "label": "Lanche da Manhã",
            "time": "09:45",
            "items": [
                "Smoothie verde com kiwi (100g), pepino (50g), gengibre e água de coco (200ml)",
                "Amêndoas (20g)",
            ],
            "calories": 210,
            "protein_g": 7,
            "carbs_g": 26,
            "fats_g": 9,
            "micros": ["Vitamina C", "Potássio", "Clorofila"],
            "justification": "Hidrata, alcaliniza e entrega antioxidantes rápidos entre refeições.",
        },
        {
            "label": "Lanche da Manhã",
            "time": "10:15",
            "items": [
                "Crackers integrais (30g)",
                "Ricota temperada com ervas (60g)",
                "Uvas (90g)",
            ],
            "calories": 240,
            "protein_g": 13,
            "carbs_g": 27,
            "fats_g": 9,
            "micros": ["Cálcio", "Vitamina K", "Antocianinas"],
            "justification": "Texturas variadas e cálcio favorecem saciedade sem pesar.",
        },
    ],
    "lunch": [
        {
            "label": "Almoço",
            "time": "13:00",
            "items": [
                "Peito de frango grelhado (120g) marinado em ervas",
                "Arroz integral cozido (150g)",
                "Mix de brócolis, cenoura e abobrinha no vapor (180g) com azeite (5ml)",
                "Salada verde com rúcula, tomate-cereja e sementes de girassol (1 c.sopa)",
            ],
            "calories": 620,
            "protein_g": 48,
            "carbs_g": 58,
            "fats_g": 20,
            "micros": ["Ferro", "Vitamina A", "Magnésio"],
            "justification": "Base equilibrada com carboidrato complexo e vegetais variados para micronutrientes.",
        },
        {
            "label": "Almoço",
            "time": "12:45",
            "items": [
                "Salmão assado com crosta de ervas (140g)",
                "Quinoa cozida (140g)",
                "Aspargos grelhados (100g) e beterraba assada (80g)",
                "Molho de iogurte com limão (20g)",
            ],
            "calories": 640,
            "protein_g": 46,
            "carbs_g": 52,
            "fats_g": 26,
            "micros": ["Ômega-3", "Vitamina K", "Folato"],
            "justification": "Aporte elevado de ácidos graxos essenciais e minerais anti-inflamatórios.",
        },
        {
            "label": "Almoço",
            "time": "13:15",
            "items": [
                "Bowl mediterrâneo com grão-de-bico (100g), pepino, tomate, pimentão e tahine (15g)",
                "Tilápia grelhada (130g)",
                "Batata-doce assada com páprica (120g)",
                "Folhas verdes com azeite e limão",
            ],
            "calories": 610,
            "protein_g": 44,
            "carbs_g": 62,
            "fats_g": 18,
            "micros": ["Fibras", "Vitamina C", "Cálcio"],
            "justification": "Perfil rico em fibras e gorduras monoinsaturadas para controle glicêmico.",
        },
        {
            "label": "Almoço",
            "time": "13:05",
            "items": [
                "Carne magra cozida (patinho) em cubos (120g)",
                "Purê de mandioquinha (140g)",
                "Legumes salteados com cúrcuma (150g)",
                "Salada de folhas com manga (80g)",
            ],
            "calories": 630,
            "protein_g": 45,
            "carbs_g": 60,
            "fats_g": 22,
            "micros": ["Ferro", "Vitamina E", "Betacaroteno"],
            "justification": "Combinação reconfortante com antioxidantes e suporte imunológico.",
        },
    ],
    "snack_pm": [
        {
            "label": "Lanche da Tarde",
            "time": "16:00",
            "items": [
                "Pão de fermentação natural (1 fatia) com pasta de grão-de-bico (40g)",
                "Pepino em rodelas (60g) com limão",
                "Chá verde gelado (200ml)",
            ],
            "calories": 260,
            "protein_g": 11,
            "carbs_g": 34,
            "fats_g": 8,
            "micros": ["Fibras", "Polifenóis", "Vitamina K"],
            "justification": "Carboidratos de baixo índice e compostos bioativos para energia estável.",
        },
        {
            "label": "Lanche da Tarde",
            "time": "16:30",
            "items": [
                "Bowl de kefir (150ml) com manga (100g)",
                "Granola proteica (20g)",
                "Sementes de cânhamo (10g)",
            ],
            "calories": 280,
            "protein_g": 14,
            "carbs_g": 32,
            "fats_g": 9,
            "micros": ["Probióticos", "Vitamina A", "Magnésio"],
            "justification": "Reforça microbiota e oferta de gorduras boas no período crítico de fome.",
        },
        {
            "label": "Lanche da Tarde",
            "time": "15:45",
            "items": [
                "Panqueca integral (2 un) com claras (80g) e banana (60g)",
                "Pasta de amêndoas (10g)",
            ],
            "calories": 300,
            "protein_g": 18,
            "carbs_g": 38,
            "fats_g": 9,
            "micros": ["Vitamina B6", "Potássio", "Cálcio"],
            "justification": "Oferece proteína magra e carboidrato de rápida absorção para treinos.",
        },
        {
            "label": "Lanche da Tarde",
            "time": "16:15",
            "items": [
                "Guacamole leve (40g) com tomate e coentro",
                "Chips de grão-de-bico assado (30g)",
                "Infusão de hibisco (200ml)",
            ],
            "calories": 270,
            "protein_g": 9,
            "carbs_g": 28,
            "fats_g": 13,
            "micros": ["Vitamina E", "Licopeno", "Fibras solúveis"],
            "justification": "Texturas crocantes e gorduras monoinsaturadas favorecem saciedade e humor.",
        },
    ],
    "dinner": [
        {
            "label": "Jantar",
            "time": "19:30",
            "items": [
                "Filé de tilápia ao forno (130g) com limão e dill",
                "Cuscuz marroquino integral (120g) com ervilhas (40g)",
                "Salada morna de couve kale (80g) com nozes (15g)",
            ],
            "calories": 520,
            "protein_g": 42,
            "carbs_g": 42,
            "fats_g": 18,
            "micros": ["Ômega-3", "Vitamina K", "Magnésio"],
            "justification": "Jantar leve, alto em proteínas e minerais calmantes para a noite.",
        },
        {
            "label": "Jantar",
            "time": "20:00",
            "items": [
                "Sopa funcional de abóbora (250ml) com gengibre e curry",
                "Tiras de peito de peru (110g)",
                "Pão integral (1 fatia) com azeite (5ml)",
            ],
            "calories": 480,
            "protein_g": 34,
            "carbs_g": 44,
            "fats_g": 15,
            "micros": ["Betacaroteno", "Vitamina B6", "Ferro"],
            "justification": "Textura confortante rica em antioxidantes e proteínas magras para recuperação.",
        },
        {
            "label": "Jantar",
            "time": "19:45",
            "items": [
                "Tofu grelhado (140g) com tamari",
                "Yakimeshi de arroz integral com legumes (180g)",
                "Salada de brotos com gergelim (10g)",
            ],
            "calories": 540,
            "protein_g": 36,
            "carbs_g": 58,
            "fats_g": 17,
            "micros": ["Cálcio", "Ferro", "Isoflavonas"],
            "justification": "Opção plant-based com perfil completo de aminoácidos e minerais.",
        },
        {
            "label": "Jantar",
            "time": "19:20",
            "items": [
                "Caril de grão-de-bico (160g) com leite de coco leve",
                "Arroz basmati integral (130g)",
                "Couve-flor assada com cúrcuma (100g)",
            ],
            "calories": 550,
            "protein_g": 30,
            "carbs_g": 60,
            "fats_g": 18,
            "micros": ["Manganês", "Vitamina C", "Fibras"],
            "justification": "Especiarias termogênicas e fibras elevadas favorecem digestão e saciedade.",
        },
    ],
}



class PlannerAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("Planner-Agent")
        self.substitution_agent = SubstitutionPrepAgent()

    async def run(self, payload: JSONDict) -> JSONDict:
        await sleep(0)
        profile = profile_from_json(payload["profile"])
        plan = self._build_weekly_plan(profile)
        logistics = await self.substitution_agent({"plan": plan_to_json(plan)})
        plan = replace(
            plan,
            shopping_list=[
                ShoppingCategory(name=item["name"], items=list(item.get("items", [])))
                for item in logistics.get("shopping_list", [])
            ],
            meal_prep=list(logistics.get("meal_prep", [])),
            substitutions=[
                SubstitutionOption(
                    item=sub["item"],
                    substitution_1=sub["substitution_1"],
                    substitution_2=sub["substitution_2"],
                    equivalence=sub["equivalence"],
                )
                for sub in logistics.get("substitutions", [])
            ],
            free_meal=logistics.get("free_meal", plan.free_meal),
            adherence_tips=list(logistics.get("adherence_tips", [])),
            follow_up_questions=list(logistics.get("follow_up_questions", [])),
        )
        return {"plan": plan_to_json(plan)}

    def _build_weekly_plan(self, profile: UserProfile) -> NutritionPlan:
        macro_targets, caloric_profile = self._compute_energy(profile)
        micro_targets = nutrition.estimate_micro_targets(profile)
        hydration_total = nutrition.hydration_goal(profile)
        days = self._compose_days(macro_targets, hydration_total)
        plan = NutritionPlan(
            user=profile.name,
            disclaimers=[_WARNING, _WARNING],
            caloric_profile=caloric_profile,
            days=days,
            macro_targets=macro_targets,
            micro_targets=micro_targets,
            hydration=HydrationPlan(
                total_liters=hydration_total,
                reminders=["500 ml ao acordar", "250 ml 30 min antes das refeições", "Goles durante treinos"],
            ),
            shopping_list=[],
            meal_prep=[],
            substitutions=[],
            free_meal="",
            adherence_tips=[],
            follow_up_questions=[],
        )
        return plan

    def _compute_energy(self, profile) -> tuple[MacroBreakdown, CaloricTarget]:
        if profile.sex == "male":
            tmb = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age + 5
        else:
            tmb = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age - 161
        activity_factor = {
            "sedentary": 1.2,
            "light": 1.375,
            "moderate": 1.55,
            "intense": 1.725,
            "extreme": 1.9,
        }.get(profile.activity_level, 1.55)
        get = tmb * activity_factor
        adjustment_pct = {"cut": -0.2, "maintain": 0.0, "bulk": 0.15}[profile.goal]
        target_calories = get * (1 + adjustment_pct)
        adjustment_kcal = target_calories - get
        protein_per_kg = {"cut": 1.4, "maintain": 1.6, "bulk": 1.9}[profile.goal]
        protein = profile.weight_kg * protein_per_kg
        fats = (target_calories * 0.3) / 9
        carbs = max((target_calories - (protein * 4 + fats * 9)) / 4, 0)
        macro_targets = MacroBreakdown(
            calories=round(target_calories, 1),
            protein_g=round(protein, 1),
            carbs_g=round(carbs, 1),
            fats_g=round(fats, 1),
        )
        caloric_profile = CaloricTarget(
            tmb=round(tmb, 1),
            get=round(get, 1),
            adjustment_kcal=round(adjustment_kcal, 1),
            target_calories=round(target_calories, 1),
        )
        return macro_targets, caloric_profile

    def _compose_days(
        self,
        macro_targets: MacroBreakdown,
        hydration_total_l: float,
    ) -> list[NutritionPlanDay]:
        days: list[NutritionPlanDay] = []
        hydration_ml = int(hydration_total_l * 1000)
        for idx in range(7):
            meals = [
                self._build_meal_entry(_MEAL_LIBRARY[key][(idx + offset) % len(_MEAL_LIBRARY[key])])
                for offset, key in enumerate(_MEAL_ORDER)
            ]
            summary = self._summarize_day(meals)
            days.append(
                NutritionPlanDay(
                    day=day_name[idx % len(day_name)],
                    meals=meals,
                    summary=summary,
                    hydration_ml=hydration_ml,
                )
            )
        return days

    def _build_meal_entry(self, template: dict[str, Any]) -> MealPlanEntry:
        return MealPlanEntry(
            label=template["label"],
            time=template["time"],
            items=list(template["items"]),
            calories=float(template["calories"]),
            protein_g=float(template["protein_g"]),
            carbs_g=float(template["carbs_g"]),
            fats_g=float(template["fats_g"]),
            micros=list(template["micros"]),
            justification=template["justification"],
        )

    def _summarize_day(self, meals: Iterable[MealPlanEntry]) -> MacroBreakdown:
        calories = sum(meal.calories for meal in meals)
        protein = sum(meal.protein_g for meal in meals)
        carbs = sum(meal.carbs_g for meal in meals)
        fats = sum(meal.fats_g for meal in meals)
        return MacroBreakdown(
            calories=round(calories, 1),
            protein_g=round(protein, 1),
            carbs_g=round(carbs, 1),
            fats_g=round(fats, 1),
        )

