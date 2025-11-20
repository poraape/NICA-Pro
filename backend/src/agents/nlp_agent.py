from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from datetime import datetime, time, timezone
from typing import Any, Iterable

try:  # pragma: no cover - optional spaCy dependency
    import spacy
    from spacy.language import Language
except Exception:  # pragma: no cover - fallback when spaCy is unavailable
    spacy = None
    Language = None  # type: ignore[assignment]

from core.models import DailyLog, FoodPortion, MealEntry
from core.serialization import log_to_json
from services.normalization import normalize_entries
from .base import BaseAgent, JSONDict

# --- Domain knowledge ------------------------------------------------------

@dataclass(slots=True)
class FoodRecord:
    canonical_name: str
    aliases: tuple[str, ...]
    dataset: str  # TACO or USDA
    default_unit: str
    default_quantity: float
    macros_per_100g: dict[str, float]


FOOD_KNOWLEDGE_BASE: tuple[FoodRecord, ...] = (
    FoodRecord(
        canonical_name="chicken_breast",
        aliases=("peito de frango", "frango grelhado", "grilled chicken", "frango"),
        dataset="USDA",
        default_unit="g",
        default_quantity=120.0,
        macros_per_100g={"kcal": 165, "protein_g": 31, "carb_g": 0, "fat_g": 3.6},
    ),
    FoodRecord(
        canonical_name="brown_rice",
        aliases=("arroz integral", "brown rice"),
        dataset="TACO",
        default_unit="g",
        default_quantity=100.0,
        macros_per_100g={"kcal": 124, "protein_g": 2.6, "carb_g": 25.8, "fat_g": 1.0},
    ),
    FoodRecord(
        canonical_name="avocado",
        aliases=("abacate", "avocado"),
        dataset="TACO",
        default_unit="g",
        default_quantity=70.0,
        macros_per_100g={"kcal": 160, "protein_g": 2.0, "carb_g": 8.5, "fat_g": 14.7},
    ),
    FoodRecord(
        canonical_name="espresso",
        aliases=("cafe", "café preto", "espresso"),
        dataset="USDA",
        default_unit="ml",
        default_quantity=60.0,
        macros_per_100g={"kcal": 1, "protein_g": 0.1, "carb_g": 0.1, "fat_g": 0.0},
    ),
)

UNIT_SYNONYMS: dict[str, tuple[str, float]] = {
    "g": ("g", 1.0),
    "grama": ("g", 1.0),
    "gramas": ("g", 1.0),
    "kg": ("g", 1000.0),
    "ml": ("ml", 1.0),
    "l": ("ml", 1000.0),
    "litro": ("ml", 1000.0),
    "litros": ("ml", 1000.0),
    "colher de sopa": ("g", 15.0),
    "colheres de sopa": ("g", 15.0),
    "colher de cha": ("g", 5.0),
    "colher de chá": ("g", 5.0),
    "xicara": ("ml", 240.0),
    "xícara": ("ml", 240.0),
    "xícaras": ("ml", 240.0),
    "un": ("g", 50.0),
    "unidade": ("g", 50.0),
    "fatias": ("g", 30.0),
    "fatia": ("g", 30.0),
    "porcao": ("g", 100.0),
    "porção": ("g", 100.0),
}

PREPARATION_KEYWORDS = {
    "grelhado": "grilled",
    "cozido": "boiled",
    "assado": "baked",
    "cru": "raw",
    "refogado": "sauteed",
    "frito": "fried",
}

EMOTION_KEYWORDS = {
    "feliz": "positive",
    "motivado": "motivated",
    "ansioso": "anxious",
    "cansado": "tired",
    "estressado": "stressed",
    "calmo": "calm",
}

SOCIAL_KEYWORDS = {
    "familia": "family",
    "família": "family",
    "amigos": "friends",
    "sozinho": "solo",
    "trabalho": "work",
}

TIME_KEYWORDS = {
    "manha": "07:30",
    "manhã": "07:30",
    "cafe": "07:30",
    "café": "07:30",
    "almoco": "12:30",
    "almoço": "12:30",
    "tarde": "16:00",
    "jantar": "20:00",
    "noite": "20:30",
}

_UNIT_PATTERN = re.compile(
    r"(?P<qty>\d+(?:[.,]\d+)?)\s*(?P<unit>" + "|".join(sorted(map(re.escape, UNIT_SYNONYMS.keys()), key=len, reverse=True)) + r")",
    re.IGNORECASE,
)
_TIME_PATTERN = re.compile(r"(?P<hour>\d{1,2})(?::(?P<minute>\d{2}))?\s*(?:h|hrs|horas)?", re.IGNORECASE)


@dataclass(slots=True)
class ParsedContext:
    emotion: str | None
    social: str | None
    time_hint: str | None


@dataclass(slots=True)
class ParsedPortion:
    quantity: float
    unit: str
    normalized_quantity: float
    normalized_unit: str


@dataclass(slots=True)
class ParsedFoodEntry:
    raw_text: str
    food: dict[str, Any]
    portion: ParsedPortion
    preparation: str | None
    context: ParsedContext
    timestamp: datetime
    nutrition_profile: dict[str, float]

    def to_json(self) -> JSONDict:
        data = {
            "raw_text": self.raw_text,
            "food": self.food,
            "portion": {
                "quantity": self.portion.quantity,
                "unit": self.portion.unit,
                "normalized_quantity": self.portion.normalized_quantity,
                "normalized_unit": self.portion.normalized_unit,
            },
            "preparation": self.preparation,
            "context": asdict(self.context),
            "timestamp": self.timestamp.isoformat(),
            "nutrition_profile": self.nutrition_profile,
        }
        return data


# --- NLP helpers -----------------------------------------------------------

def _load_spacy_pipeline() -> Language | None:
    if spacy is None:
        return None
    try:  # pragma: no cover - dependent on optional model
        return spacy.load("pt_core_news_sm")
    except Exception:  # pragma: no cover - fallback lightweight pipeline
        return spacy.blank("pt")


def _detect_preparation(text: str) -> str | None:
    lowered = text.lower()
    for keyword, label in PREPARATION_KEYWORDS.items():
        if keyword in lowered:
            return label
    return None


def _detect_context(text: str) -> ParsedContext:
    lowered = text.lower()
    emotion = next((value for key, value in EMOTION_KEYWORDS.items() if key in lowered), None)
    social = next((value for key, value in SOCIAL_KEYWORDS.items() if key in lowered), None)
    time_hint = None
    match = _TIME_PATTERN.search(text)
    if match:
        hour = int(match.group("hour"))
        minute = int(match.group("minute") or 0)
        time_hint = f"{hour:02d}:{minute:02d}"
    if not time_hint:
        time_hint = next((value for key, value in TIME_KEYWORDS.items() if key in lowered), None)
    return ParsedContext(emotion=emotion, social=social, time_hint=time_hint)


def _match_foods(text: str) -> list[FoodRecord]:
    lowered = text.lower()
    matches: list[tuple[int, FoodRecord]] = []
    for record in FOOD_KNOWLEDGE_BASE:
        indices = [lowered.find(alias) for alias in record.aliases if alias in lowered]
        if indices:
            matches.append((min(indices), record))
    if not matches:
        fallback = FoodRecord(
            canonical_name="unknown",
            aliases=(text.strip().lower(),),
            dataset="fallback",
            default_unit="g",
            default_quantity=100.0,
            macros_per_100g={"kcal": 0, "protein_g": 0, "carb_g": 0, "fat_g": 0},
        )
        return [fallback]
    matches.sort(key=lambda item: item[0])
    return [record for _, record in matches]


def _normalize_quantity(quantity: float, unit: str | None) -> ParsedPortion:
    unit_key = (unit or "g").lower().strip()
    base = UNIT_SYNONYMS.get(unit_key)
    if base:
        normalized_unit, multiplier = base
        normalized_quantity = quantity * multiplier
        unit_label = unit
    else:
        normalized_unit = "g"
        multiplier = 1.0
        normalized_quantity = quantity
        unit_label = unit or "g"
    return ParsedPortion(
        quantity=quantity,
        unit=unit_label or normalized_unit,
        normalized_quantity=normalized_quantity,
        normalized_unit=normalized_unit,
    )


def _extract_portion_candidates(text: str) -> Iterable[tuple[float, str | None]]:
    for match in _UNIT_PATTERN.finditer(text):
        qty = float(match.group("qty").replace(",", "."))
        unit = match.group("unit")
        yield qty, unit


def _resolve_timestamp(base_date: str | None, time_hint: str | None) -> datetime:
    today = datetime.now(timezone.utc).date()
    if base_date:
        try:
            today = datetime.fromisoformat(base_date).date()
        except ValueError:
            pass
    if time_hint:
        hour, minute = map(int, time_hint.split(":"))
        return datetime.combine(today, time(hour=hour, minute=minute, tzinfo=timezone.utc))
    return datetime.combine(today, time(tzinfo=timezone.utc))


def _portion_for_record(record: FoodRecord, candidate: tuple[float, str | None] | None) -> ParsedPortion:
    if candidate is None:
        return _normalize_quantity(record.default_quantity, record.default_unit)
    quantity, unit = candidate
    return _normalize_quantity(quantity, unit or record.default_unit)


def _nutrition_profile(record: FoodRecord, portion: ParsedPortion) -> dict[str, float]:
    base_qty = portion.normalized_quantity or 1
    factor = base_qty / 100.0
    return {key: round(value * factor, 2) for key, value in record.macros_per_100g.items()}


class NLPAgent(BaseAgent):
    """Advanced NLP agent responsible for diary parsing and normalization."""

    def __init__(self, model: Language | None = None) -> None:
        super().__init__("NLP-Agent")
        self._nlp = model or _load_spacy_pipeline()

    async def run(self, payload: JSONDict) -> JSONDict:
        user = payload["user"]
        entries: list[str] = payload.get("entries", [])
        base_date = payload.get("date")
        parsed_entries: list[ParsedFoodEntry] = []
        for raw in entries:
            parsed_entries.extend(self._parse_entry(raw, base_date))
        meals = self._entries_to_meals(parsed_entries)
        log = DailyLog(user=user, date=datetime.now(timezone.utc), meals=meals)
        return {
            "log": log_to_json(log),
            "entities": [entry.to_json() for entry in parsed_entries],
            "contexts": self._aggregate_context(parsed_entries),
        }

    def _parse_entry(self, text: str, base_date: str | None) -> list[ParsedFoodEntry]:
        context = _detect_context(text)
        preparation = _detect_preparation(text)
        foods = _match_foods(text)
        portions_candidates = list(_extract_portion_candidates(text))
        entries: list[ParsedFoodEntry] = []
        timestamp = _resolve_timestamp(base_date, context.time_hint)
        for idx, record in enumerate(foods):
            candidate = portions_candidates[idx] if idx < len(portions_candidates) else None
            portion = _portion_for_record(record, candidate)
            nutrition = _nutrition_profile(record, portion)
            food_payload = {
                "label": record.aliases[0].title() if record.aliases else record.canonical_name,
                "canonical": record.canonical_name,
                "dataset": record.dataset,
            }
            entries.append(
                ParsedFoodEntry(
                    raw_text=text,
                    food=food_payload,
                    portion=portion,
                    preparation=preparation,
                    context=context,
                    timestamp=timestamp,
                    nutrition_profile=nutrition,
                )
            )
        return entries

    def _entries_to_meals(self, entries: list[ParsedFoodEntry]) -> list[MealEntry]:
        meals: list[MealEntry] = []
        for entry in entries:
            portion = FoodPortion(
                label=entry.food["canonical"],
                quantity=entry.portion.normalized_quantity,
                unit=entry.portion.normalized_unit,
            )
            description_parts = [entry.food["label"]]
            if entry.preparation:
                description_parts.append(f"({entry.preparation})")
            if entry.context.emotion:
                description_parts.append(f"emotion:{entry.context.emotion}")
            if entry.context.social:
                description_parts.append(f"social:{entry.context.social}")
            description = " ".join(description_parts)
            meals.append(
                MealEntry(
                    timestamp=entry.timestamp,
                    description=description,
                    items=[portion],
                )
            )
        return normalize_entries(meals)

    def _aggregate_context(self, entries: list[ParsedFoodEntry]) -> JSONDict:
        emotions = [e.context.emotion for e in entries if e.context.emotion]
        socials = [e.context.social for e in entries if e.context.social]
        times = [e.context.time_hint for e in entries if e.context.time_hint]
        return {
            "emotions": emotions,
            "social": socials,
            "time_hints": times,
        }
