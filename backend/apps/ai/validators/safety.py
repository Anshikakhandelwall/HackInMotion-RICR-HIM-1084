"""Post-generation safety checks on model output.

Each check corresponds to a rule in AGENTS.md section 11. The checks are
deliberately literal and pattern-based rather than clever: a validator that
itself needs a language model to decide what is safe would reintroduce exactly
the problem it exists to solve.

These patterns will not catch every unsafe phrasing. They are a floor, not a
ceiling, and every one of them should have a test.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from ..schemas.interaction import InteractionFact, Severity

# Reference sources the product knows about (AGENTS.md section 9). If output
# names one of these and the supplying facts did not, the model has invented an
# attribution.
KNOWN_SOURCE_NAMES = ("DDInter", "openFDA", "DailyMed", "RxNorm", "RxNav")

# Instructions to change medication, which this product never issues itself
# (AGENTS.md section 11, "No unsafe medication instructions").
UNSAFE_INSTRUCTION_PATTERNS = (
    (r"\bstop (?:taking|using)\b", "tells the reader to stop a medicine"),
    (r"\bdiscontinue\b", "tells the reader to discontinue a medicine"),
    # Verb stems plus optional inflection, so "halving the dose" is caught as
    # well as "halve the dose".
    (
        r"\b(?:doubl|tripl|halv|increas|decreas|reduc|adjust|chang|alter)(?:e|es|ed|ing)?\s+(?:the\s+|your\s+)?dos",
        "tells the reader to change a dose",
    ),
    (r"\bswitch to\b", "tells the reader to substitute a medicine"),
    (r"\breplace .{0,30}\bwith\b", "tells the reader to substitute a medicine"),
    (r"\bstart taking\b", "tells the reader to start a medicine"),
    (r"\bskip (?:a |your )?dose\b", "tells the reader to skip a dose"),
)

# Claims of absolute safety, which the product must never make
# (AGENTS.md section 11, "No absolute safety claims").
ABSOLUTE_SAFETY_PATTERNS = (
    (r"\b(?:completely|totally|perfectly|entirely) safe\b", "claims absolute safety"),
    (r"\bno risk\b", "claims absence of risk"),
    (r"\brisk[- ]free\b", "claims absence of risk"),
    (r"\bharmless\b", "claims the combination is harmless"),
    (r"\bnothing to worry about\b", "dismisses risk outright"),
    (r"\bperfectly fine\b", "claims absolute safety"),
)


@dataclass(frozen=True)
class SafetyViolation:
    """One rule the generated text broke."""

    rule: str
    detail: str
    excerpt: str

    def __str__(self) -> str:
        return f"{self.rule}: {self.detail} ({self.excerpt!r})"


def _excerpt(text: str, match: re.Match, width: int = 40) -> str:
    start = max(0, match.start() - width)
    end = min(len(text), match.end() + width)
    return text[start:end].strip()


def _check_patterns(text: str, patterns, rule: str) -> list[SafetyViolation]:
    violations = []
    for pattern, detail in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            violations.append(
                SafetyViolation(rule=rule, detail=detail, excerpt=_excerpt(text, match))
            )
    return violations


def _check_invented_severity(text: str, facts: tuple[InteractionFact, ...]) -> list[SafetyViolation]:
    """Flag severity words the supplied facts did not contain.

    A model that upgrades "Minor" to "Major" produces text that reads as
    authoritative and is wrong in the most consequential direction available.
    """
    permitted = {fact.severity.value.lower() for fact in facts}
    violations = []
    for severity in Severity:
        word = severity.value.lower()
        if word in permitted:
            continue
        match = re.search(rf"\b{re.escape(word)}\b", text, flags=re.IGNORECASE)
        if match:
            violations.append(
                SafetyViolation(
                    rule="invented-severity",
                    detail=(
                        f"uses severity {severity.value!r}, which is not in the "
                        f"supplied facts (they say: {', '.join(sorted(permitted))})"
                    ),
                    excerpt=_excerpt(text, match),
                )
            )
    return violations


def _check_invented_source(text: str, facts: tuple[InteractionFact, ...]) -> list[SafetyViolation]:
    """Flag reference sources the supplied facts did not cite."""
    cited = " ".join(fact.source for fact in facts).lower()
    violations = []
    for source in KNOWN_SOURCE_NAMES:
        if source.lower() in cited:
            continue
        match = re.search(rf"\b{re.escape(source)}\b", text, flags=re.IGNORECASE)
        if match:
            violations.append(
                SafetyViolation(
                    rule="invented-source",
                    detail=f"cites {source!r}, which none of the supplied facts came from",
                    excerpt=_excerpt(text, match),
                )
            )
    return violations


def check_explanation(text: str, facts: tuple[InteractionFact, ...]) -> list[SafetyViolation]:
    """Return every safety rule the generated text broke.

    An empty list means the text passed. It does not mean the text is correct —
    only that it did not trip any rule encoded here.
    """
    return [
        *_check_patterns(text, UNSAFE_INSTRUCTION_PATTERNS, "unsafe-instruction"),
        *_check_patterns(text, ABSOLUTE_SAFETY_PATTERNS, "absolute-safety-claim"),
        *_check_invented_severity(text, facts),
        *_check_invented_source(text, facts),
    ]
