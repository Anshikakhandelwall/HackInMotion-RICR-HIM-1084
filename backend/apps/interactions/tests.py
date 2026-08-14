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
