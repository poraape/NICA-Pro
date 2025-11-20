from __future__ import annotations

from asyncio import sleep
from random import choice

from core.models import CoachingMessage, MacroBreakdown, MicroBreakdown, TrendInsight
from core.serialization import (
    coaching_to_json,
    macro_from_json,
    micro_from_json,
    trend_from_json,
)
from services.security import disclaimer_message
from .base import BaseAgent, JSONDict


class CoachAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("Coach-Agent")
        self._metaphors = [
            "Pense nas refeições como tijolos leves construindo uma ponte calma entre onde você está e onde quer chegar.",
            "Cada garfada equilibrada funciona como um metrônomo: define o ritmo e ensina o corpo a manter cadência.",
            "Seu prato é como um painel de controle; pequenos ajustes nos botões mudam todo o voo, não é preciso girar todos de uma vez.",
        ]
        self._micro_habits = [
            "Respire profundamente por 90 segundos antes da refeição principal para sinalizar ao cérebro que não há pressa.",
            "Separe lanches proteicos já porcionados à noite para acordar com escolhas prontas.",
            "Beba um copo de água enquanto monta o prato, criando o hábito automático de hidratação.",
            "Faça uma checagem rápida de fome real versus emocional antes do jantar anotando o que sente.",
            "Use o timer do celular para lembrar de levantar e alongar entre refeições longas de trabalho.",
        ]
        self._progress_quotes = [
            "Seu corpo responde ao que você faz sempre, não ao que faz perfeito.",
            "Se melhorar 1% por dia, seu futuro muda.",
            "Você está formando uma identidade alimentar mais forte e consciente.",
        ]

    async def run(self, payload: JSONDict) -> JSONDict:
        await sleep(0)
        macros = macro_from_json(payload["macros"])
        targets = macro_from_json(payload["targets"])
        micros = micro_from_json(payload["micros"])
        trends = [trend_from_json(item) for item in payload.get("trends", [])]
        messages: list[CoachingMessage] = [disclaimer_message()]
        messages.append(self._positive_reinforcement(macros, targets))
        messages.append(self._progress_over_perfection())
        messages.append(self._metaphor_message())
        messages.append(self._micro_habit())
        messages.extend(self._nutrient_guidance(macros, targets, micros))
        messages.extend(self._trend_messages(trends))
        messages.append(self._behavior_tip())
        return {"messages": [coaching_to_json(message) for message in messages]}

    def _positive_reinforcement(
        self, macros: MacroBreakdown, targets: MacroBreakdown
    ) -> CoachingMessage:
        calorie_ratio = self._safe_ratio(macros.calories, targets.calories)
        protein_ratio = self._safe_ratio(macros.protein_g, targets.protein_g)
        body = (
            f"Você alcançou {calorie_ratio:.0f}% da meta calórica e {protein_ratio:.0f}% da meta de proteínas. "
            "Esse ritmo constante ensina o corpo a confiar na rotina."
        )
        return CoachingMessage(
            title="Consistência gentil",
            body=body,
            severity="success",
        )

    def _progress_over_perfection(self) -> CoachingMessage:
        return CoachingMessage(
            title="Progresso acima de perfeição",
            body=choice(self._progress_quotes),
            severity="info",
        )

    def _metaphor_message(self) -> CoachingMessage:
        return CoachingMessage(
            title="Metáfora para memorizar",
            body=choice(self._metaphors),
            severity="info",
        )

    def _micro_habit(self) -> CoachingMessage:
        return CoachingMessage(
            title="Micro-hábito da semana",
            body=choice(self._micro_habits),
            severity="success",
        )

    def _nutrient_guidance(
        self,
        macros: MacroBreakdown,
        targets: MacroBreakdown,
        micros: MicroBreakdown,
    ) -> list[CoachingMessage]:
        guidance: list[CoachingMessage] = []
        protein_ratio = self._safe_ratio(macros.protein_g, targets.protein_g)
        if protein_ratio < 70:
            guidance.append(
                CoachingMessage(
                    title="Reforço proteico",
                    body="Inclua fontes magras pré-porcionadas para evitar improvisos em horários de fome.",
                    severity="warning",
                )
            )
        if micros.fiber_g < 20:
            guidance.append(
                CoachingMessage(
                    title="Fibra protetora",
                    body="Adicione verduras crocantes ou sementes a duas refeições para desacelerar a fome reativa.",
                    severity="warning",
                )
            )
        if micros.sodium_mg > 2000:
            guidance.append(
                CoachingMessage(
                    title="Sódio em observação",
                    body="Troque temperos prontos por ervas frescas e prove antes de adicionar sal extra.",
                    severity="warning",
                )
            )
        carb_delta = macros.carbs_g - targets.carbs_g
        if carb_delta > 30:
            guidance.append(
                CoachingMessage(
                    title="Carboidratos noturnos",
                    body="Distribua carboidratos complexos mais cedo e guarde vegetais + proteínas para o jantar.",
                    severity="info",
                )
            )
        return guidance

    def _trend_messages(self, trends: list[TrendInsight]) -> list[CoachingMessage]:
        if not trends:
            return []
        return [
            CoachingMessage(
                title=f"Tendência: {trend.pattern}",
                body=f"{trend.signal}. {trend.projection}",
                severity="success",
            )
            for trend in trends
        ]

    def _behavior_tip(self) -> CoachingMessage:
        return CoachingMessage(
            title="Regulação emocional",
            body=(
                "Quando sentir ansiedade, tire 90 segundos para respirar e nomear o sentimento antes de buscar comida. "
                "Isso cria disciplina leve e previne impulsos."
            ),
            severity="info",
        )

    @staticmethod
    def _safe_ratio(value: float, target: float) -> float:
        if target <= 0:
            return 0.0
        return max(0.0, min(200.0, (value / target) * 100))
