"""Tests for the AI layer's safety guarantees.

Every one drives real text through the real validator using StubProvider, so no
API key and no network are needed.
"""

from django.test import SimpleTestCase

from apps.ai.prompts.explanation import build_user_prompt
from apps.ai.prompts.safety import safety_preamble
from apps.ai.providers.stub import StubProvider
from apps.ai.schemas.interaction import ExplanationRequest, InteractionFact, Severity
from apps.ai.services.ai_service import explain_interactions, no_interaction_found
from apps.ai.services.explanation_service import (
    UnsafeExplanationError,
    generate_explanation,
)
from apps.ai.validators.safety import check_explanation

WARFARIN_ASPIRIN = InteractionFact(
    medicine_a="Warfarin",
    medicine_b="Aspirin",
    severity=Severity.MAJOR,
    source="DDInter 2.0",
    mechanism="Additive effect on bleeding risk.",
    management="Monitor for signs of bleeding.",
)

FACTS = (WARFARIN_ASPIRIN,)


def request_for(text: str) -> tuple[ExplanationRequest, StubProvider]:
    return ExplanationRequest(facts=FACTS), StubProvider(canned_response=text)


class SchemaContractTests(SimpleTestCase):
    def test_fact_requires_a_source(self):
        """An unattributed fact must not be constructible at all."""
        with self.assertRaises(ValueError):
            InteractionFact(
                medicine_a="A", medicine_b="B", severity=Severity.MINOR, source="  "
            )

    def test_request_requires_at_least_one_fact(self):
        """The AI layer never answers from its own knowledge."""
        with self.assertRaises(ValueError):
            ExplanationRequest(facts=())

    def test_unknown_audience_is_rejected(self):
        with self.assertRaises(ValueError):
            ExplanationRequest(facts=FACTS, audience="marketing")

    def test_pair_is_order_independent(self):
        flipped = InteractionFact(
            medicine_a="Aspirin",
            medicine_b="Warfarin",
            severity=Severity.MAJOR,
            source="DDInter 2.0",
        )
        self.assertEqual(WARFARIN_ASPIRIN.pair, flipped.pair)


class PromptTests(SimpleTestCase):
    def test_prompt_contains_the_facts_and_their_source(self):
        prompt = build_user_prompt(ExplanationRequest(facts=FACTS))
        self.assertIn("Warfarin", prompt)
        self.assertIn("Aspirin", prompt)
        self.assertIn("Major", prompt)
        self.assertIn("DDInter 2.0", prompt)

    def test_safety_rules_are_attached_for_every_audience(self):
        for audience in ExplanationRequest.AUDIENCES:
            preamble = safety_preamble(audience)
            self.assertIn("Never assign, upgrade, or downgrade a severity", preamble)
            self.assertIn("Never describe a combination as safe", preamble)


class SafetyValidatorTests(SimpleTestCase):
    """One test per medical-safety rule the validator enforces."""

    def test_accepts_a_faithful_explanation(self):
        text = (
            "Taking Warfarin and Aspirin together is a Major interaction. Both "
            "affect bleeding, so together they raise the chance of bleeding. "
            "Watch for unusual bruising, and speak to your doctor or pharmacist "
            "about this combination. Source: DDInter 2.0."
        )
        self.assertEqual(check_explanation(text, FACTS), [])

    def test_rejects_instruction_to_stop_a_medicine(self):
        violations = check_explanation("You should stop taking Aspirin.", FACTS)
        self.assertEqual([v.rule for v in violations], ["unsafe-instruction"])

    def test_rejects_instruction_to_change_a_dose(self):
        violations = check_explanation("Consider halving the dose of Warfarin.", FACTS)
        self.assertTrue(any(v.rule == "unsafe-instruction" for v in violations))

    def test_rejects_absolute_safety_claim(self):
        violations = check_explanation("These two are completely safe together.", FACTS)
        self.assertTrue(any(v.rule == "absolute-safety-claim" for v in violations))

    def test_rejects_downgraded_severity(self):
        """The most consequential failure available: a Major read as Minor."""
        violations = check_explanation("This is only a Minor interaction.", FACTS)
        self.assertTrue(any(v.rule == "invented-severity" for v in violations))

    def test_rejects_fabricated_source(self):
        violations = check_explanation("According to DailyMed, this is fine.", FACTS)
        self.assertTrue(any(v.rule == "invented-source" for v in violations))

    def test_reports_every_violation_not_just_the_first(self):
        text = "Stop taking Aspirin — this combination is completely safe otherwise."
        rules = {v.rule for v in check_explanation(text, FACTS)}
        self.assertEqual(rules, {"unsafe-instruction", "absolute-safety-claim"})


class ExplanationServiceTests(SimpleTestCase):
    def test_returns_explanation_carrying_its_facts(self):
        text = "Warfarin with Aspirin is a Major interaction. Watch for bleeding."
        request, provider = request_for(text)
        explanation = generate_explanation(request, provider)

        self.assertEqual(explanation.text, text)
        self.assertEqual(explanation.facts, FACTS)
        self.assertTrue(explanation.generated_by_ai)
        self.assertIn("not medical advice", explanation.disclaimer.lower())
        self.assertEqual(explanation.sources, ("DDInter 2.0",))

    def test_unsafe_output_is_withheld_not_returned(self):
        request, provider = request_for("Just stop taking Warfarin, it is harmless.")
        with self.assertRaises(UnsafeExplanationError) as ctx:
            generate_explanation(request, provider)
        self.assertTrue(ctx.exception.violations)

    def test_entry_point_returns_none_rather_than_raising(self):
        """A failed explanation must degrade the page, not break it."""
        provider = StubProvider(canned_response="You should stop taking Warfarin.")
        self.assertIsNone(explain_interactions(FACTS, provider=provider))

    def test_entry_point_returns_explanation_on_success(self):
        provider = StubProvider(
            canned_response="Warfarin and Aspirin interact. Severity: Major."
        )
        explanation = explain_interactions(FACTS, provider=provider)
        self.assertIsNotNone(explanation)
        self.assertEqual(explanation.model, "stub-no-model")


class NoInteractionResultTests(SimpleTestCase):
    def test_wording_never_implies_safety(self):
        result = no_interaction_found(
            checked_medicines=("Paracetamol", "Cetirizine"),
            sources_checked=("DDInter 2.0",),
        )
        self.assertFalse(result.generated_by_ai)
        self.assertIn("not the same as confirming they are safe", result.message)
        self.assertEqual(check_explanation(result.message, FACTS), [])
