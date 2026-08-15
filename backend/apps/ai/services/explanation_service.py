"""Turns verified interaction facts into a checked, plain-language explanation.

The order of operations matters and is the whole point of this module:

    build prompt  ->  call provider  ->  validate output  ->  return

Validation sits after generation, not before returning raw text to a caller, so
there is no code path where unchecked model output reaches a user.
"""

from __future__ import annotations

import logging

from ..prompts.explanation import build_user_prompt
from ..prompts.safety import safety_preamble
from ..providers.base import LLMProvider, ProviderError
from ..schemas.explanation import Explanation
from ..schemas.interaction import ExplanationRequest
from ..validators.safety import check_explanation

logger = logging.getLogger(__name__)


class UnsafeExplanationError(RuntimeError):
    """Generated text broke a safety rule and was withheld.

    Carries the violations so the caller can log them. The text itself is
    deliberately not attached: it failed review, and passing it along invites
    someone downstream to display it anyway.
    """

    def __init__(self, violations):
        self.violations = tuple(violations)
        super().__init__(
            "Generated explanation failed safety validation: "
            + "; ".join(str(v) for v in self.violations)
        )


import json

def generate_explanation(
    request: ExplanationRequest,
    provider: LLMProvider,
) -> Explanation:
    system = safety_preamble(request.audience)
    user = build_user_prompt(request)

    text = provider.generate(system=system, user=user)

    violations = check_explanation(text, request.facts)
    if violations:
        logger.warning(
            "Withheld AI explanation from provider %s: %d violation(s)",
            provider.name,
            len(violations),
        )
        raise UnsafeExplanationError(violations)

    what_does_this_mean = text
    what_to_watch_for = ""
    what_should_you_do = ""

    cleaned_text = text.strip()
    if cleaned_text.startswith("```"):
        lines = cleaned_text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned_text = "\n".join(lines).strip()

    try:
        data = json.loads(cleaned_text)
        if isinstance(data, dict):
            what_does_this_mean = data.get("what_does_this_mean", text)
            what_to_watch_for = data.get("what_to_watch_for", "")
            what_should_you_do = data.get("what_should_you_do", "")
    except Exception:
        pass

    return Explanation(
        text=text,
        facts=request.facts,
        model=provider.model_id,
        what_does_this_mean=what_does_this_mean,
        what_to_watch_for=what_to_watch_for,
        what_should_you_do=what_should_you_do,
    )


def safe_generate_explanation(
    request: ExplanationRequest,
    provider: LLMProvider,
) -> Explanation | None:
    """As `generate_explanation`, but returns None instead of raising.

    For callers whose job is to render interaction results: the verified facts
    are the product, and the explanation is an enhancement on top of them. A
    missing explanation degrades the page; a raised exception breaks it.
    """
    try:
        return generate_explanation(request, provider)
    except (UnsafeExplanationError, ProviderError):
        logger.exception("AI explanation unavailable; falling back to facts only")
        return None
