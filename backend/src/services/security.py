from __future__ import annotations

from core.models import CoachingMessage


CLINICAL_DISCLAIMER = (
    "Conteúdo educativo. Consulte profissionais de saúde antes de mudanças"
)


def compliance_badges() -> list[str]:
    return ["NICA Secure", "HIPAA-ready", "LGPD friendly"]


def disclaimer_message() -> CoachingMessage:
    return CoachingMessage(
        title="Validação Clínica",
        body=CLINICAL_DISCLAIMER,
        severity="info",
    )
