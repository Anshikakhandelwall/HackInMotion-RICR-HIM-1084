"""The AI layer's public entry point.

Everything outside `apps.ai` should come through here. Keeping one door means
the provider choice, the prompt construction, and the safety checks can all
change without touching the apps that call in.

Not wired to HTTP yet: this app has no urls.py or views.py on purpose. The
interactions app will call these functions directly once its data flow exists.
"""

from __future__ import annotations

from ..providers.base import LLMProvider
from ..schemas.explanation import Explanation, NoInteractionResult
from ..schemas.interaction import ExplanationRequest, InteractionFact
from .explanation_service import safe_generate_explanation
from .provider_service import get_provider


def explain_interactions(
    facts: tuple[InteractionFact, ...],
    audience: str = "patient",
    provider: LLMProvider | None = None,
) -> Explanation | None:
    """Explain verified interaction facts in plain language.

    Returns None when no explanation could be produced safely. Callers must
    handle that case by showing the facts alone rather than showing nothing.
    """
    request = ExplanationRequest(facts=facts, audience=audience)
    return safe_generate_explanation(request, provider or get_provider())


def no_interaction_found(
    checked_medicines: tuple[str, ...],
    sources_checked: tuple[str, ...],
) -> NoInteractionResult:
    """The result when the reference data holds no relevant interaction.

    Routed through this app so the wording stays in one place, but note that no
    model is called: AGENTS.md section 11 forbids implying that "nothing found"
    means "safe", and fixed wording is the only way to guarantee that.
    """
    return NoInteractionResult(
        checked_medicines=checked_medicines,
        sources_checked=sources_checked,
    )
