import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

from src.api.router import ProfilePayload
from src.core.validation import validate_profile
from src.domain.entities import UserProfile


def _build_profile(**overrides):
    payload = ProfilePayload(
        name="alice",
        age=30,
        weight_kg=70,
        height_cm=170,
        sex="female",
        activity_level="moderate",
        goal="maintain",
        systolic_bp=120,
        diastolic_bp=80,
        sodium_mg=2000,
        allergies=[],
        comorbidities=[],
    )
    data = payload.model_dump() | overrides
    return UserProfile(**data)


def test_profile_payload_computes_bmi():
    payload = ProfilePayload(
        name="alice",
        age=25,
        weight_kg=60,
        height_cm=165,
        sex="female",
        activity_level="light",
        goal="cut",
        systolic_bp=115,
        diastolic_bp=75,
        sodium_mg=1800,
        allergies=["peanut"],
        comorbidities=["asma"],
    )
    assert payload.bmi == pytest.approx(22.0, rel=1e-2)


def test_validate_profile_detects_hypertension():
    profile = _build_profile(systolic_bp=165, diastolic_bp=100)
    with pytest.raises(ValueError):
        validate_profile(profile)


def test_validate_profile_returns_notes_for_risks():
    profile = _build_profile(sodium_mg=5000, bmi=32, comorbidities=["renal"], allergies=["milk"])
    notes = validate_profile(profile)
    assert any("sódio" in note.lower() for note in notes)
    assert any("comorbidades" in note.lower() for note in notes)
    assert any("alergias" in note.lower() for note in notes)
