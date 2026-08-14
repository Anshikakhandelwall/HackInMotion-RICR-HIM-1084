from apps.interactions.services import InteractionEngine


class PatientSafetyEngine:
    """
    Combines canonical drug-drug interactions with patient-specific health profiles
    (conditions, allergies, current medicines) to produce personalized safety warnings.
    """

    @classmethod
    def evaluate_patient_safety(cls, medicines, medical_conditions=None, user_profile=None):
        """
        Evaluates personalized safety:
        1. Runs canonical drug-drug interaction check via InteractionEngine.
        2. Evaluates condition-specific safety warnings.
        3. Returns unified safety report.
        """
        # Base drug interaction check
        base_result = InteractionEngine.check_interactions(medicines)

        # Parse conditions
        conditions_str = ""
        if isinstance(medical_conditions, str):
            conditions_str = medical_conditions
        elif user_profile and hasattr(user_profile, "medical_conditions"):
            conditions_str = user_profile.medical_conditions or ""

        conditions_list = [c.strip().lower() for c in conditions_str.replace(";", ",").split(",") if c.strip()]

        patient_warnings = []

        # Condition safety checks
        checked_med_names = [m["rxnorm_name"].lower() for m in base_result.get("checked_medicines", [])]

        for condition in conditions_list:
            if "asthma" in condition:
                # Aspirin / NSAIDs caution for asthma patients
                for med_name in checked_med_names:
                  if any(nsaid in med_name for nsaid in ["aspirin", "ibuprofen", "naproxen", "diclofenac"]):
                        patient_warnings.append({
                            "type": "condition_warning",
                            "severity": "Moderate",
                            "title": "Asthma & NSAID Caution",
                            "description": f"Patient has asthma. {med_name.title()} should be used with caution as NSAIDs can trigger bronchospasm in susceptible individuals.",
                        })

            if any(term in condition for term in ["kidney", "renal"]):
                for med_name in checked_med_names:
                    if any(drug in med_name for drug in ["ibuprofen", "naproxen", "metformin"]):
                        patient_warnings.append({
                            "type": "condition_warning",
                            "severity": "Major",
                            "title": "Renal Impairment Warning",
                            "description": f"Patient has renal history. Use of {med_name.title()} requires dosage adjustment or renal monitoring.",
                        })

            if any(term in condition for term in ["hypertension", "blood pressure", "high bp"]):
                for med_name in checked_med_names:
                    if any(drug in med_name for drug in ["pseudoephedrine", "ibuprofen"]):
                        patient_warnings.append({
                            "type": "condition_warning",
                            "severity": "Moderate",
                            "title": "Hypertension Caution",
                            "description": f"Patient has hypertension. {med_name.title()} may elevate blood pressure.",
                        })

        total_warnings = len(base_result.get("interactions", [])) + len(patient_warnings)
        has_warnings = total_warnings > 0

        return {
            "has_warnings": has_warnings,
            "drug_interactions": base_result,
            "patient_condition_warnings": patient_warnings,
            "summary": {
                "total_medicines_checked": base_result["summary"]["total_checked"],
                "drug_interactions_count": base_result["summary"]["interactions_found"],
                "condition_warnings_count": len(patient_warnings),
                "major_warnings": base_result["summary"]["major"] + sum(1 for w in patient_warnings if w["severity"] == "Major"),
                "moderate_warnings": base_result["summary"]["moderate"] + sum(1 for w in patient_warnings if w["severity"] == "Moderate"),
            },
        }
