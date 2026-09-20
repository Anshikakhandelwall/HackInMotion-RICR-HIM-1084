from apps.interactions.services import InteractionEngine


# ── Allergy keyword → medicine ingredient map ─────────────────────────────────
# Maps common allergy terms to ingredient keywords found in medicine names.
_ALLERGY_MED_MAP = {
    "penicillin":    ["penicillin", "amoxicillin", "ampicillin", "piperacillin", "nafcillin", "oxacillin"],
    "sulfa":         ["sulfamethoxazole", "sulfadiazine", "sulfasalazine", "trimethoprim"],
    "aspirin":       ["aspirin", "acetylsalicylic"],
    "nsaid":         ["aspirin", "ibuprofen", "naproxen", "diclofenac", "celecoxib", "indomethacin", "ketorolac"],
    "ibuprofen":     ["ibuprofen"],
    "codeine":       ["codeine"],
    "latex":         [],
    "egg":           [],
}


def _parse_list(text):
    """Split a comma/semicolon-separated string into a cleaned lowercase list."""
    if not text:
        return []
    return [t.strip().lower() for t in text.replace(";", ",").split(",") if t.strip()]


class PatientSafetyEngine:
    """
    Combines canonical drug-drug interactions with patient-specific health profiles
    (conditions, allergies, current medicines) to produce personalized safety warnings.

    evaluate_patient_safety(medicines, medical_conditions, known_allergies)
    """

    @classmethod
    def evaluate_patient_safety(
        cls,
        medicines,
        medical_conditions=None,
        known_allergies=None,
        user_profile=None,
    ):
        """
        Evaluates personalized safety:
        1. Runs canonical drug-drug interaction check via InteractionEngine.
        2. Evaluates condition-specific safety warnings.
        3. Evaluates allergy-specific safety warnings.
        4. Returns unified safety report.
        """
        # Base drug interaction check
        base_result = InteractionEngine.check_interactions(medicines)

        # ── Resolve conditions & allergies ────────────────────────────────────
        conditions_str = ""
        allergies_str = ""

        if isinstance(medical_conditions, str):
            conditions_str = medical_conditions
        elif user_profile and hasattr(user_profile, "medical_conditions"):
            conditions_str = user_profile.medical_conditions or ""

        if isinstance(known_allergies, str):
            allergies_str = known_allergies
        elif user_profile and hasattr(user_profile, "known_allergies"):
            allergies_str = user_profile.known_allergies or ""

        conditions_list = _parse_list(conditions_str)
        allergies_list  = _parse_list(allergies_str)

        # Resolved medicine names from the interaction engine's lookup
        checked_med_names = [m["rxnorm_name"].lower() for m in base_result.get("checked_medicines", [])]

        patient_warnings = []

        # ── Condition warnings ────────────────────────────────────────────────
        for condition in conditions_list:
            if "asthma" in condition:
                for med_name in checked_med_names:
                    if any(nsaid in med_name for nsaid in ["aspirin", "ibuprofen", "naproxen", "diclofenac"]):
                        patient_warnings.append({
                            "type": "condition_warning",
                            "severity": "Moderate",
                            "title": "Asthma & NSAID Caution",
                            "description": (
                                f"Patient has asthma. {med_name.title()} should be used with caution "
                                "as NSAIDs can trigger bronchospasm in susceptible individuals."
                            ),
                        })

            if any(term in condition for term in ["kidney", "renal"]):
                for med_name in checked_med_names:
                    if any(drug in med_name for drug in ["ibuprofen", "naproxen", "metformin"]):
                        patient_warnings.append({
                            "type": "condition_warning",
                            "severity": "Major",
                            "title": "Renal Impairment Warning",
                            "description": (
                                f"Patient has renal history. Use of {med_name.title()} "
                                "requires dosage adjustment or renal monitoring."
                            ),
                        })

            if any(term in condition for term in ["hypertension", "blood pressure", "high bp"]):
                for med_name in checked_med_names:
                    if any(drug in med_name for drug in ["pseudoephedrine", "ibuprofen"]):
                        patient_warnings.append({
                            "type": "condition_warning",
                            "severity": "Moderate",
                            "title": "Hypertension Caution",
                            "description": (
                                f"Patient has hypertension. {med_name.title()} may elevate blood pressure."
                            ),
                        })

            if any(term in condition for term in ["diabetes", "diabetic"]):
                for med_name in checked_med_names:
                    if any(drug in med_name for drug in ["corticosteroid", "prednisone", "dexamethasone"]):
                        patient_warnings.append({
                            "type": "condition_warning",
                            "severity": "Moderate",
                            "title": "Diabetes & Corticosteroid Caution",
                            "description": (
                                f"Patient has diabetes. {med_name.title()} may raise blood glucose levels."
                            ),
                        })

            if any(term in condition for term in ["liver", "hepatic"]):
                for med_name in checked_med_names:
                    if any(drug in med_name for drug in ["acetaminophen", "paracetamol", "methotrexate", "isoniazid"]):
                        patient_warnings.append({
                            "type": "condition_warning",
                            "severity": "Major",
                            "title": "Hepatic Impairment Warning",
                            "description": (
                                f"Patient has liver history. {med_name.title()} is hepatotoxic at higher doses; "
                                "dose reduction or avoidance is recommended."
                            ),
                        })

        # ── Allergy warnings ──────────────────────────────────────────────────
        allergy_warnings = []
        for allergy in allergies_list:
            # Direct name match first (e.g. allergy = "ibuprofen")
            for med_name in checked_med_names:
                if allergy in med_name:
                    allergy_warnings.append({
                        "type": "allergy_warning",
                        "severity": "Major",
                        "title": f"Allergy Alert: {allergy.title()}",
                        "description": (
                            f"Patient has a documented allergy to {allergy.title()}. "
                            f"{med_name.title()} contains or is related to this allergen."
                        ),
                    })
                    continue

            # Map-based cross-reactivity check
            ingredient_keywords = _ALLERGY_MED_MAP.get(allergy, [])
            for keyword in ingredient_keywords:
                for med_name in checked_med_names:
                    if keyword in med_name and allergy not in med_name:  # avoid double-reporting
                        allergy_warnings.append({
                            "type": "allergy_warning",
                            "severity": "Major",
                            "title": f"Allergy Cross-Reactivity: {allergy.title()}",
                            "description": (
                                f"Patient has a documented allergy to {allergy.title()}. "
                                f"{med_name.title()} may cross-react with this allergen."
                            ),
                        })

        all_patient_warnings = patient_warnings + allergy_warnings
        total_warnings = len(base_result.get("interactions", [])) + len(all_patient_warnings)
        has_warnings = total_warnings > 0

        return {
            "has_warnings": has_warnings,
            "drug_interactions": base_result,
            "patient_condition_warnings": patient_warnings,
            "allergy_warnings": allergy_warnings,
            "summary": {
                "total_medicines_checked": base_result["summary"]["total_checked"],
                "drug_interactions_count": base_result["summary"]["interactions_found"],
                "condition_warnings_count": len(patient_warnings),
                "allergy_warnings_count": len(allergy_warnings),
                "major_warnings": (
                    base_result["summary"]["major"]
                    + sum(1 for w in all_patient_warnings if w["severity"] == "Major")
                ),
                "moderate_warnings": (
                    base_result["summary"]["moderate"]
                    + sum(1 for w in all_patient_warnings if w["severity"] == "Moderate")
                ),
            },
        }
