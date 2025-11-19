from __future__ import annotations


class Resource:
    def __init__(self, attributes: dict[str, object]) -> None:
        self.attributes = attributes

    @classmethod
    def create(cls, attributes: dict[str, object]) -> "Resource":  # pragma: no cover - trivial
        return cls(attributes)
