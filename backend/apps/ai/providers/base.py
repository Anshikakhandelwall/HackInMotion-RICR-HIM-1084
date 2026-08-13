"""The provider interface.

Deliberately small. A provider turns a system prompt plus a user prompt into
text, and reports which model produced it. Everything else — what counts as a
safe explanation, how facts are rendered, when to refuse — lives above this
boundary so it stays vendor-independent and testable without a network.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ProviderError(RuntimeError):
    """A provider could not produce a completion.

    Raised for transport failures, authentication problems, and rate limits
    alike. Callers in the AI layer treat every one of them the same way: the
    explanation is unavailable, and the caller falls back to showing the
    verified facts on their own. An interaction check must never fail closed
    just because a language model was unreachable.
    """


class LLMProvider(ABC):
    """Base class for anything that can generate text for this app."""

    #: Short identifier used in logs and settings, e.g. "stub".
    name: str = "unnamed"

    @abstractmethod
    def generate(self, *, system: str, user: str, max_tokens: int = 1024) -> str:
        """Return the model's text response.

        Implementations must raise `ProviderError` rather than leaking a
        vendor-specific exception type, so callers can handle failure without
        importing a vendor SDK.
        """

    @property
    @abstractmethod
    def model_id(self) -> str:
        """The exact model that served the request, recorded on the Explanation."""
