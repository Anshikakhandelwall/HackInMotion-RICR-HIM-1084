"""Service layer.

Three modules, three jobs:

- `provider_service` decides which provider to talk to.
- `explanation_service` turns verified facts into a checked explanation.
- `ai_service` is the entry point the rest of the backend calls.

Nothing outside this package should construct a provider or build a prompt
directly.
"""
