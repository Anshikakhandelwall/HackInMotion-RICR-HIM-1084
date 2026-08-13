"""Builds the user-side prompt for an interaction explanation.

The facts are rendered as an explicit, labelled block so the model is never left
guessing which parts of the prompt are authoritative.
"""

from __future__ import annotations

from ..schemas.interaction import ExplanationRequest, InteractionFact


def render_fact(fact: InteractionFact) -> str:
    lines = [
        f"- Medicines: {fact.medicine_a} + {fact.medicine_b}",
        f"  Severity: {fact.severity.value}",
        f"  Source: {fact.source}",
    ]
    if fact.mechanism:
        lines.append(f"  Mechanism: {fact.mechanism}")
    if fact.management:
        lines.append(f"  Management: {fact.management}")
    return "\n".join(lines)


def build_user_prompt(request: ExplanationRequest) -> str:
    """Render the verified facts and the task into one prompt body."""
    facts_block = "\n".join(render_fact(fact) for fact in request.facts)
    return (
        "Here are the verified interaction facts. They are the only information "
        "you may draw on:\n\n"
        f"{facts_block}\n\n"
        "Explain these interactions to the reader. Cover what the interaction "
        "means, what to watch for, and what to do next. Keep the severity "
        "wording exactly as given above."
    )
