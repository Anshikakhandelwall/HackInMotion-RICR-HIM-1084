from django.test import TestCase
from django.db import IntegrityError
from apps.medicines.models import Medicine, DDInterDrugMapping
from apps.interactions.models import DrugInteraction


class InteractionModelsTest(TestCase):
    def setUp(self):
        self.med_a = Medicine.objects.create(
            rxcui="161",
            rxnorm_name="acetaminophen",
            tty="IN",
        )
        self.med_b = Medicine.objects.create(
            rxcui="11289",
            rxnorm_name="warfarin",
            tty="IN",
        )

    def test_ddinter_mapping_creation(self):
        mapping = DDInterDrugMapping.objects.create(
            ddinter_drug_name="Acetaminophen",
            medicine=self.med_a,
            mapping_status="matched",
            mapping_method="exact_or_normalized",
        )
        self.assertEqual(mapping.ddinter_drug_name, "Acetaminophen")
        self.assertEqual(mapping.medicine, self.med_a)

    def test_drug_interaction_creation(self):
        interaction = DrugInteraction.objects.create(
            medicine_a=self.med_a,
            medicine_b=self.med_b,
            level="Moderate",
        )
        self.assertEqual(interaction.medicine_a, self.med_a)
        self.assertEqual(interaction.medicine_b, self.med_b)
        self.assertEqual(interaction.level, "Moderate")
        self.assertIn("acetaminophen + warfarin [Moderate]", str(interaction))

    def test_unique_pair_constraint(self):
        DrugInteraction.objects.create(
            medicine_a=self.med_a,
            medicine_b=self.med_b,
            level="Moderate",
        )
        with self.assertRaises(IntegrityError):
            DrugInteraction.objects.create(
                medicine_a=self.med_a,
                medicine_b=self.med_b,
                level="Major",
            )


class InteractionCheckAPITestCase(TestCase):
    def setUp(self):
        self.med_a = Medicine.objects.create(
            rxcui="161",
            rxnorm_name="acetaminophen",
            tty="IN",
        )
        self.med_b = Medicine.objects.create(
            rxcui="11289",
            rxnorm_name="warfarin",
            tty="IN",
        )
        self.med_c = Medicine.objects.create(
            rxcui="7052",
            rxnorm_name="morphine",
            tty="IN",
        )

        # Create interaction between med_a and med_b
        a_id, b_id = (self.med_a.id, self.med_b.id) if self.med_a.id < self.med_b.id else (self.med_b.id, self.med_a.id)
        m_a, m_b = (self.med_a, self.med_b) if self.med_a.id < self.med_b.id else (self.med_b, self.med_a)

        self.interaction = DrugInteraction.objects.create(
            medicine_a=m_a,
            medicine_b=m_b,
            level="Moderate",
        )

    def test_check_interacting_pair(self):
        response = self.client.post(
            "/api/interactions/check/",
            data={"medicines": ["161", "11289"]},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertTrue(response.data["has_interactions"])
        self.assertEqual(len(response.data["interactions"]), 1)
        self.assertEqual(response.data["summary"]["moderate"], 1)

    def test_check_non_interacting_pair(self):
        response = self.client.post(
            "/api/interactions/check/",
            data={"medicines": ["161", "7052"]},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertFalse(response.data["has_interactions"])
        self.assertEqual(len(response.data["interactions"]), 0)

    def test_check_empty_medicines_validation_error(self):
        response = self.client.post(
            "/api/interactions/check/",
            data={"medicines": []},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])

    def test_check_duplicate_medicines(self):
        response = self.client.post(
            "/api/interactions/check/",
            data={"medicines": ["161", "161", "11289"]},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["summary"]["total_checked"], 2)

