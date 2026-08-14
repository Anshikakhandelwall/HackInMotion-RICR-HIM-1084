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
        self.assertEqual(str(self.medicine), "acetaminophen (161)")

    def test_unique_rxcui_constraint(self):
        """Test that duplicate RxCUIs raise integrity error."""
        with self.assertRaises(Exception):
            Medicine.objects.create(
                rxcui="161",
                rxnorm_name="duplicate acetaminophen",
            )


class MedicineAPITestCase(TestCase):
    def setUp(self):
        self.med1 = Medicine.objects.create(
            rxcui="161",
            rxnorm_name="acetaminophen",
            tty="IN",
        )
        self.med2 = Medicine.objects.create(
            rxcui="11289",
            rxnorm_name="warfarin",
            tty="IN",
        )

    def test_list_medicines(self):
        response = self.client.get("/api/medicines/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["count"], 2)

    def test_search_medicines_by_name(self):
        response = self.client.get("/api/medicines/?search=aceta")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["rxcui"], "161")

    def test_search_medicines_by_rxcui(self):
        response = self.client.get("/api/medicines/?search=11289")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["rxnorm_name"], "warfarin")

    def test_get_medicine_by_id(self):
        response = self.client.get(f"/api/medicines/{self.med1.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["medicine"]["rxcui"], "161")

    def test_get_medicine_by_invalid_id(self):
        response = self.client.get("/api/medicines/99999/")
        self.assertEqual(response.status_code, 404)
        self.assertFalse(response.data["success"])

    def test_get_medicine_by_rxcui(self):
        response = self.client.get(f"/api/medicines/rxcui/{self.med2.rxcui}/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["medicine"]["rxnorm_name"], "warfarin")

    def test_get_medicine_by_invalid_rxcui(self):
        response = self.client.get("/api/medicines/rxcui/99999999/")
        self.assertEqual(response.status_code, 404)
        self.assertFalse(response.data["success"])

