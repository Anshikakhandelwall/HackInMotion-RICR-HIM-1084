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

#: Registry of available providers, keyed by `LLMProvider.name`.
#:
#: A concrete vendor provider is not chosen yet. To add one: implement
#: `LLMProvider` in `providers/`, register it here, and set AI_PROVIDER in
#: settings. Nothing else in the app needs to change.
_PROVIDERS: dict[str, type[LLMProvider]] = {
    StubProvider.name: StubProvider,
}


def available_providers() -> tuple[str, ...]:
    return tuple(_PROVIDERS)


def get_provider(name: str | None = None) -> LLMProvider:
    """Return a provider instance.

    Raises `ValueError` for an unknown name rather than falling back, so a typo
    in configuration surfaces immediately instead of quietly downgrading to the
    stub in production.
    """
    resolved = name or getattr(settings, "AI_PROVIDER", StubProvider.name)
    try:
        provider_class = _PROVIDERS[resolved]
    except KeyError:
        raise ValueError(
            f"Unknown AI provider {resolved!r}. Available: {', '.join(available_providers())}"
        ) from None
    return provider_class()
