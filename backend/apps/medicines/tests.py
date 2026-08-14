from django.test import TestCase
from apps.medicines.models import Medicine


class MedicineModelTest(TestCase):
    def setUp(self):
        self.medicine = Medicine.objects.create(
            rxcui="161",
            rxnorm_name="acetaminophen",
            tty="IN",
        )

    def test_medicine_creation(self):
        """Test creating a Medicine model instance."""
        self.assertEqual(self.medicine.rxcui, "161")
        self.assertEqual(self.medicine.rxnorm_name, "acetaminophen")
        self.assertEqual(self.medicine.tty, "IN")
        self.assertEqual(str(self.medicine), "acetaminophen (RxCUI: 161)")

    def test_unique_rxcui_constraint(self):
        """Test that duplicate RxCUIs raise integrity error."""
        with self.assertRaises(Exception):
            Medicine.objects.create(
                rxcui="161",
                rxnorm_name="duplicate acetaminophen",
            )

