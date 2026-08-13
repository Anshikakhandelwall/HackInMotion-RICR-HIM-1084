"""What goes *into* the AI layer.

Everything in this module represents verified information sourced from the
interactions app. None of it is ever produced by a language model.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class Severity(str, Enum):
    """The four severity categories DDInter uses.

    Mapping source data onto these values is deterministic and belongs to the
    interactions app. The AI layer reads severity; it never assigns or revises
    it. Keeping this a closed enum is what makes that rule enforceable rather
    than merely a convention.
    """

    MAJOR = "Major"
    MODERATE = "Moderate"
    MINOR = "Minor"
    UNKNOWN = "Unknown"


@dataclass(frozen=True)
class InteractionFact:
    """One verified drug-drug interaction.

    Frozen so a prompt builder cannot quietly alter a fact on its way to the
    model, and so the same object can be handed back to the caller alongside the
    generated text as proof of what the explanation was derived from.
    """

    medicine_a: str
    medicine_b: str
    severity: Severity
    source: str
    mechanism: str | None = None
    management: str | None = None

    def __post_init__(self) -> None:
        if not self.source.strip():
            raise ValueError(
                "InteractionFact.source is required. An interaction with no "
                "attribution must not reach the AI layer: every claim shown to "
                "a user has to be traceable to the data it came from."
            )

    @property
    def pair(self) -> tuple[str, str]:
        """The medicine pair, ordered so it reads the same either way round."""
        return tuple(sorted((self.medicine_a, self.medicine_b)))


@dataclass(frozen=True)
class ExplanationRequest:
    """A request to explain a set of verified interactions in plain language.

    `audience` exists because the product serves patients, caregivers, and
    pharmacists. The same facts warrant different wording for each, but never
    different facts.
    """

    facts: tuple[InteractionFact, ...]
    audience: str = "patient"

    AUDIENCES = ("patient", "caregiver", "pharmacist")

    def __post_init__(self) -> None:
        if not self.facts:
            raise ValueError(
                "ExplanationRequest requires at least one verified fact. The AI "
                "layer does not answer from its own knowledge."
            )
        if self.audience not in self.AUDIENCES:
            raise ValueError(
                f"Unknown audience {self.audience!r}; expected one of {self.AUDIENCES}."
            )
