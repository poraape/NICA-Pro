import asyncio
from pathlib import Path
import sys

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent))

from backend.src.agents.nlp_agent import NLPAgent


def test_parses_foods_quantities_and_contexts():
    agent = NLPAgent(model=None)
    payload = {
        "user": "Ana",
        "date": "2024-05-20",
        "entries": [
            "07:30 - Café feliz sozinho: 1 xícara de café preto e me senti motivado",
            "Almoço em família às 13h: 150g de frango grelhado com 100g de arroz integral",
        ],
    }
    result = asyncio.run(agent(payload))

    assert "log" in result
    assert len(result["entities"]) >= 3  # espresso + chicken + rice

    espresso = next(entry for entry in result["entities"] if entry["food"]["canonical"] == "espresso")
    assert espresso["portion"]["normalized_unit"] == "ml"
    assert espresso["context"]["emotion"] == "positive"

    chicken = next(entry for entry in result["entities"] if entry["food"]["canonical"] == "chicken_breast")
    assert chicken["portion"]["normalized_quantity"] == pytest.approx(150.0)
    assert chicken["preparation"] == "grilled"

    rice = next(entry for entry in result["entities"] if entry["food"]["canonical"] == "brown_rice")
    assert rice["portion"]["normalized_quantity"] == pytest.approx(100.0)


def test_safe_fallback_for_unknown_items():
    agent = NLPAgent(model=None)
    payload = {
        "user": "Bea",
        "entries": ["Lanche tarde - snack misterioso sem detalhes"],
    }
    result = asyncio.run(agent(payload))

    assert result["entities"][0]["food"]["canonical"] == "unknown"
    assert result["entities"][0]["portion"]["normalized_quantity"] == pytest.approx(100.0)
    assert result["contexts"]["emotions"] == []
