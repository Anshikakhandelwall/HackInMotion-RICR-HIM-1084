"""A provider that makes no network call.

Its purpose is to keep the AI layer runnable and testable before a vendor is
chosen, and to keep it testable afterwards without spending tokens or depending
on a live service. It echoes the facts it was given, which means the safety
validators see realistic input: text that mentions real medicines and real
severity words.
"""

from __future__ import annotations

from .base import LLMProvider


class StubProvider(LLMProvider):
    name = "stub"

    def __init__(self, canned_response: str | None = None) -> None:
        """`canned_response` lets a test drive a specific output through the
        validators — including deliberately unsafe text, to prove they catch it.
        """
        self._canned_response = canned_response

    @property
    def model_id(self) -> str:
        return "stub-no-model"

    def generate(self, *, system: str, user: str, max_tokens: int = 1024) -> str:
        if self._canned_response is not None:
            return self._canned_response
        return (
            "This is placeholder text from the stub provider. No language model "
            "was called. The verified interaction details are shown alongside "
            "this message."
        )
