"""Language-model providers.

`base.LLMProvider` is the only interface the rest of the app codes against, so
swapping or adding a vendor touches this package and nothing else. No concrete
vendor provider ships yet — that choice is still open. `stub.StubProvider`
exists so the layer is runnable and testable without an API key or a network.
"""

from .base import LLMProvider, ProviderError
from .stub import StubProvider
from .clinical_ai import ClinicalAIProvider

__all__ = ["LLMProvider", "ProviderError", "StubProvider", "ClinicalAIProvider"]
