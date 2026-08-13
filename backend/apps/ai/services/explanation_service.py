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


def generate_explanation(
    request: ExplanationRequest,
    provider: LLMProvider,
) -> Explanation:
    """Generate one explanation for a set of verified facts.

    Raises `UnsafeExplanationError` if the output fails validation, and
    `ProviderError` if the model could not be reached. Callers are expected to
    handle both by falling back to the verified facts on their own — an
    interaction check must still work when the AI layer does not.
    """
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

    return Explanation(
        text=text,
        facts=request.facts,
        model=provider.model_id,
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
