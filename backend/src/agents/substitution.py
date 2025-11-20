from __future__ import annotations

from asyncio import sleep
from core.serialization import plan_from_json
from .base import BaseAgent, JSONDict

_CATEGORY_ORDER = [
    "Hortifruti",
    "Proteínas",
    "Grãos e Cereais",
    "Laticínios e Alternativas",
    "Oleaginosas e Sementes",
    "Temperos e Óleos",
    "Snacks Saudáveis",
    "Bebidas e Hidratação",
]

_INGREDIENT_CATEGORIES: dict[str, str] = {
    "espinafre": "Hortifruti",
    "tomate": "Hortifruti",
    "mirtilos": "Hortifruti",
    "mamão": "Hortifruti",
    "morangos": "Hortifruti",
    "banana": "Hortifruti",
    "maçã": "Hortifruti",
    "uvas": "Hortifruti",
    "kiwi": "Hortifruti",
    "pepino": "Hortifruti",
    "brócolis": "Hortifruti",
    "cenoura": "Hortifruti",
    "abobrinha": "Hortifruti",
    "aspargos": "Hortifruti",
    "beterraba": "Hortifruti",
    "pimentão": "Hortifruti",
    "couve": "Hortifruti",
    "kale": "Hortifruti",
    "couve-flor": "Hortifruti",
    "rúcula": "Hortifruti",
    "tilápia": "Proteínas",
    "frango": "Proteínas",
    "salmão": "Proteínas",
    "carne": "Proteínas",
    "peru": "Proteínas",
    "tofu": "Proteínas",
    "grão-de-bico": "Proteínas",
    "ovos": "Proteínas",
    "iogurte": "Laticínios e Alternativas",
    "cottage": "Laticínios e Alternativas",
    "kefir": "Laticínios e Alternativas",
    "ricota": "Laticínios e Alternativas",
    "bebida vegetal": "Laticínios e Alternativas",
    "aveia": "Grãos e Cereais",
    "tapioca": "Grãos e Cereais",
    "granola": "Grãos e Cereais",
    "quinoa": "Grãos e Cereais",
    "arroz": "Grãos e Cereais",
    "cuscuz": "Grãos e Cereais",
    "pão": "Grãos e Cereais",
    "mandioquinha": "Grãos e Cereais",
    "batata": "Grãos e Cereais",
    "linhaça": "Oleaginosas e Sementes",
    "chia": "Oleaginosas e Sementes",
    "nozes": "Oleaginosas e Sementes",
    "amêndoas": "Oleaginosas e Sementes",
    "castanhas": "Oleaginosas e Sementes",
    "azeite": "Temperos e Óleos",
    "tahine": "Temperos e Óleos",
    "curry": "Temperos e Óleos",
    "gengibre": "Temperos e Óleos",
    "ervas": "Temperos e Óleos",
    "limão": "Temperos e Óleos",
    "hibisco": "Bebidas e Hidratação",
    "chá": "Bebidas e Hidratação",
    "água de coco": "Bebidas e Hidratação",
    "smoothie": "Bebidas e Hidratação",
    "crackers": "Snacks Saudáveis",
    "chips": "Snacks Saudáveis",
}

_SUBSTITUTION_BANK = {
    "frango": (
        "Frango grelhado 120g",
        "Tilápia grelhada 150g",
        "Tofu firme 180g",
        "Mantém ~30g de proteína magra",
    ),
    "salmão": (
        "Salmão 140g",
        "Sardinha fresca 130g",
        "Mix de ovos + linhaça",
        "Repõe ômega-3 e proteínas completas",
    ),
    "aveia": (
        "Aveia 35g",
        "Centeio em flocos 35g",
        "Granola sem açúcar 40g",
        "Garante fibras solúveis",
    ),
    "arroz": (
        "Arroz integral 150g",
        "Quinoa 130g",
        "Batata-doce assada 160g",
        "Carboidratos complexos equivalentes",
    ),
    "iogurte": (
        "Iogurte grego 150g",
        "Kefir 180ml",
        "Bebida vegetal proteica 200ml",
        "Probióticos + 12-15g de proteína",
    ),
    "grão-de-bico": (
        "Grão-de-bico 100g",
        "Feijão branco 120g",
        "Edamame 140g",
        "Mesma entrega de fibras e proteína vegetal",
    ),
    "quinoa": (
        "Quinoa cozida 140g",
        "Cevada integral 150g",
        "Arroz negro 130g",
        "Perfil de carboidratos com baixo IG",
    ),
    "chia": (
        "Chia 10g",
        "Linhaça dourada 12g",
        "Mix de sementes (girassol + abóbora) 18g",
        "Fibras + ômega-3",
    ),
    "amêndoas": (
        "Amêndoas 20g",
        "Castanha de caju 25g",
        "Pistache 25g",
        "Gorduras boas e magnésio",
    ),
    "batata": (
        "Batata-doce 160g",
        "Inhame 150g",
        "Purê de couve-flor 200g",
        "Mesma saciedade com menor índice glicêmico",
    ),
}

_FALLBACK_SUBS = [
    (
        "Ovos 2 unidades",
        "Queijo cottage 80g",
        "Tempeh 120g",
        "Proteína rápida para lanches",
    ),
    (
        "Pasta de amendoim 15g",
        "Tahine 15g",
        "Manteiga de amêndoas 15g",
        "Gorduras monoinsaturadas",
    ),
    (
        "Overnight oats",
        "Panqueca integral",
        "Tapioca recheada",
        "Equilíbrio calórico similar",
    ),
]

_MEAL_PREP_GUIDE = [
    "Domingo: cozinhe 1kg de peito de frango, desfie metade e congele em porções.",
    "Prepare 4 potes de arroz ou quinoa (150g prontos) para os almoços da semana.",
    "Asse bandejas de legumes (brócolis, cenoura, abobrinha) e armazene por até 3 dias.",
    "Monte overnight oats em 3 potes com frutas e sementes para cafés rápidos.",
    "Porcione snacks (mix de oleaginosas + frutas secas) em saquinhos individuais.",
    "Deixe molhos saudáveis prontos (vinagrete cítrico, tahine com limão, pesto light).",
]

_ADHERENCE_TIPS = [
    "Priorize proteínas em cada refeição para preservar massa magra.",
    "Hidrate-se antes das refeições principais para modular apetite.",
    "Use pratos menores e mastigue 20x cada garfada para sinalizar saciedade.",
    "Planeje compras com a lista categorizada e evite ir ao mercado com fome.",
    "Registre emoções no diário alimentar para o Trend-Agent detectar gatilhos.",
]

_FOLLOW_UP_QUESTIONS = [
    "Deseja mais variedade ou manter refeições repetidas?",
    "Prefere receitas mais rápidas ou elaboradas?",
    "Alguma refeição ficou com ingredientes que você não gosta?",
]


class SubstitutionPrepAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("Substitution-MealPrep-Agent")

    async def run(self, payload: JSONDict) -> JSONDict:
        await sleep(0)
        plan = plan_from_json(payload["plan"])
        shopping = self._build_shopping(plan.days)
        substitutions = self._build_substitutions(plan.days)
        return {
            "shopping_list": shopping,
            "meal_prep": list(_MEAL_PREP_GUIDE),
            "substitutions": substitutions,
            "free_meal": (
                "Reserve um almoço na semana para refeição livre consciente: escolha um prato afetivo, "
                "garanta vegetais no prato, limite bebidas açucaradas e retome o plano na refeição seguinte."
            ),
            "adherence_tips": list(_ADHERENCE_TIPS),
            "follow_up_questions": list(_FOLLOW_UP_QUESTIONS),
        }

    def _build_shopping(self, days) -> list[JSONDict]:
        grouped: dict[str, set[str]] = {category: set() for category in _CATEGORY_ORDER}
        for day in days:
            for meal in day.meals:
                for item in meal.items:
                    lowered = item.lower()
                    for keyword, category in _INGREDIENT_CATEGORIES.items():
                        if keyword in lowered:
                            grouped[category].add(self._normalize_item(item))
        return [
            {"name": category, "items": sorted(items)}
            for category, items in grouped.items()
            if items
        ]

    def _build_substitutions(self, days) -> list[JSONDict]:
        found: list[tuple[str, str, str, str]] = []
        ingredients = self._flatten_ingredients(days)
        for keyword, data in _SUBSTITUTION_BANK.items():
            if any(keyword in ingredient for ingredient in ingredients):
                found.append(data)
        if len(found) < 10:
            needed = 10 - len(found)
            found.extend(_FALLBACK_SUBS[:needed])
        return [
            {
                "item": item,
                "substitution_1": sub1,
                "substitution_2": sub2,
                "equivalence": equivalence,
            }
            for item, sub1, sub2, equivalence in found[:10]
        ]

    def _flatten_ingredients(self, days) -> set[str]:
        entries: set[str] = set()
        for day in days:
            for meal in day.meals:
                for item in meal.items:
                    entries.add(item.lower())
        return entries

    def _normalize_item(self, raw: str) -> str:
        base = raw.split("(")[0]
        return base.replace("-", " ").strip().title()
