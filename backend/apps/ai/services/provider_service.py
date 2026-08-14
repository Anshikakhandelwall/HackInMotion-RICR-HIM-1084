"""Chooses the language-model provider.

Resolution order: an explicit argument, then Django settings, then the stub.
Defaulting to the stub is deliberate — a misconfigured deployment produces
placeholder text next to the real interaction data rather than silently
reaching for a vendor nobody configured.
"""

from __future__ import annotations

from django.conf import settings

from ..providers.base import LLMProvider
from ..providers.stub import StubProvider
from ..providers.clinical_ai import ClinicalAIProvider

#: Registry of available providers, keyed by `LLMProvider.name`.
_PROVIDERS: dict[str, type[LLMProvider]] = {
    StubProvider.name: StubProvider,
    ClinicalAIProvider.name: ClinicalAIProvider,
}


def available_providers() -> tuple[str, ...]:
    return tuple(_PROVIDERS)


def get_provider(name: str | None = None) -> LLMProvider:
    resolved = name or getattr(settings, "AI_PROVIDER", ClinicalAIProvider.name)
    try:
        provider_class = _PROVIDERS[resolved]
    except KeyError:
        raise ValueError(
            f"Unknown AI provider {resolved!r}. Available: {', '.join(available_providers())}"
        ) from None
    return provider_class()
