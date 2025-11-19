from __future__ import annotations

from math import pow

from ..core.models import UserProfile


def _calculate_bmi(profile: UserProfile) -> float:
    height_m = profile.height_cm / 100
    if height_m <= 0:
        raise ValueError("Altura deve ser positiva")
    return round(profile.weight_kg / pow(height_m, 2), 1)


def validate_profile(profile: UserProfile) -> list[str]:
    notes: list[str] = []
    if profile.age < 18:
        raise ValueError("NICA-Pro atende apenas maiores de idade")
    if profile.weight_kg <= 0 or profile.height_cm <= 0:
        raise ValueError("Peso e altura devem ser positivos")

    bmi = profile.bmi or _calculate_bmi(profile)
    profile.bmi = bmi
    if bmi < 18 or bmi > 40:
        raise ValueError("IMC fora da faixa segura para acompanhamento automático")
    if bmi >= 30:
        notes.append("IMC sugere obesidade; priorize supervisão clínica e ajustes graduais")

    if profile.age >= 65:
        notes.append("Idade avançada requer monitoramento individualizado e ajustes conservadores")

    if profile.systolic_bp >= 160 or profile.diastolic_bp >= 100:
        raise ValueError("Pressão arterial crítica — procure avaliação médica antes de prosseguir")
    if profile.systolic_bp >= 140 or profile.diastolic_bp >= 90:
        notes.append(
            "Pressão arterial elevada: priorize redução de sódio, hidratação e acompanhamento médico"
        )

    if profile.sodium_mg > 4000:
        notes.append("Ingestão de sódio acima do recomendado; considere cortes imediatos")

    if profile.comorbidities:
        notes.append(
            "Comorbidades informadas — recomenda-se revisão profissional antes de mudanças intensas"
        )

    if profile.allergies:
        notes.append("Alergias registradas: personalize substituições para evitar reações")

    return notes
