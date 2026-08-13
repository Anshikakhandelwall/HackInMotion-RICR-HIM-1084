"""Checks applied to model output before it reaches a user.

The prompt asks the model to behave; this package verifies that it did. Both
halves are needed — a prompt is a request, not a guarantee.
"""

from .safety import SafetyViolation, check_explanation

__all__ = ["SafetyViolation", "check_explanation"]
