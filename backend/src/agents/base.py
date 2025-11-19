from __future__ import annotations

import abc
from typing import Any, TypedDict


class JSONPayload(TypedDict, total=False):
    """Typed representation for agent payloads."""


JSONDict = dict[str, Any]


class BaseAgent(abc.ABC):
    name: str

    def __init__(self, name: str) -> None:
        self.name = name

    async def __call__(self, payload: JSONDict) -> JSONDict:
        return await self.run(payload)

    @abc.abstractmethod
    async def run(self, payload: JSONDict) -> JSONDict:  # pragma: no cover - interface
        raise NotImplementedError
