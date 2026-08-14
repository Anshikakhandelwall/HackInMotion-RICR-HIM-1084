from itertools import combinations
from django.db.models import Q
from apps.medicines.models import Medicine, DDInterDrugMapping
from apps.interactions.models import DrugInteraction


class InteractionEngine:
    """
    Service engine for resolving medicine identifiers and executing pairwise
    drug-drug interaction lookups against the DrugInteraction database.
    """

    @classmethod
    def resolve_medicines(cls, raw_medicines):
        """
        Resolves a list of raw medicine inputs (RxCUIs, database IDs, or drug names)
        to a deduplicated list of canonical Medicine model instances.
        """
        if not raw_medicines:
            return []

        resolved_ids = set()
        medicines = []

        for item in raw_medicines:
            item_str = str(item).strip()
            if not item_str:
                continue

            med = None

            # 1. Try matching by RxCUI
            med = Medicine.objects.filter(rxcui=item_str).first()

            # 2. If digit, try matching by PK ID
            if not med and item_str.isdigit():
                med = Medicine.objects.filter(pk=int(item_str)).first()

            # 3. Try exact/case-insensitive match by rxnorm_name
            if not med:
                med = Medicine.objects.filter(rxnorm_name__iexact=item_str).first()

            # 4. Try DDInter mapping lookup
            if not med:
                mapping = DDInterDrugMapping.objects.filter(
                    ddinter_drug_name__iexact=item_str,
                    mapping_status="matched",
                ).select_related("medicine").first()
                if mapping:
                    med = mapping.medicine

            if med and med.id not in resolved_ids:
                resolved_ids.add(med.id)
                medicines.append(med)

        return medicines

    @classmethod
    def check_interactions(cls, raw_medicines):
        """
        Executes pairwise interaction checking for N medicines:
        - Resolves inputs to canonical Medicine objects.
        - Generates N(N-1)/2 unique pairs.
        - Performs single database ORM query using Q objects.
        - Returns structured result payload.
        """
        medicines = cls.resolve_medicines(raw_medicines)

        checked_meds_payload = [
            {
                "id": m.id,
                "rxcui": m.rxcui,
                "name": m.rxnorm_name,
                "rxnorm_name": m.rxnorm_name,
                "tty": m.tty,
            }
            for m in medicines
        ]

        if len(medicines) < 2:
            return {
                "has_interactions": False,
                "summary": {
                    "total_checked": len(medicines),
                    "pairs_checked": 0,
                    "interactions_found": 0,
                    "major": 0,
                    "moderate": 0,
                    "minor": 0,
                },
                "checked_medicines": checked_meds_payload,
                "interactions": [],
            }

        # Generate unique canonical medicine pairs
        # The schema orders medicine_a and medicine_b by lower/higher primary key
        pair_tuples = []
        pair_map = {}

        for m1, m2 in combinations(medicines, 2):
            a_id, b_id = (m1.id, m2.id) if m1.id < m2.id else (m2.id, m1.id)
            med_a, med_b = (m1, m2) if m1.id < m2.id else (m2, m1)

            pair_tuples.append((a_id, b_id))
            pair_map[(a_id, b_id)] = (med_a, med_b)

        # Single optimized ORM query for all pairs
        q_filter = Q()
        for a_id, b_id in pair_tuples:
            q_filter |= Q(medicine_a_id=a_id, medicine_b_id=b_id)

        matching_interactions = DrugInteraction.objects.filter(q_filter).select_related(
            "medicine_a", "medicine_b"
        )

        interactions_payload = []
        major_count = 0
        moderate_count = 0
        minor_count = 0

        for inter in matching_interactions:
            sev_level = (getattr(inter, "level", None) or getattr(inter, "severity", "")).title()

            if sev_level == "Major":
                major_count += 1
            elif sev_level == "Moderate":
                moderate_count += 1
            elif sev_level == "Minor":
                minor_count += 1

            interactions_payload.append(
                {
                    "id": inter.id,
                    "medicine_a": {
                        "id": inter.medicine_a.id,
                        "rxcui": inter.medicine_a.rxcui,
                        "name": inter.medicine_a.rxnorm_name,
                        "rxnorm_name": inter.medicine_a.rxnorm_name,
                    },
                    "medicine_b": {
                        "id": inter.medicine_b.id,
                        "rxcui": inter.medicine_b.rxcui,
                        "name": inter.medicine_b.rxnorm_name,
                        "rxnorm_name": inter.medicine_b.rxnorm_name,
                    },
                    "severity": sev_level,
                    "level": sev_level,
                    "description": f"Potential {sev_level.lower()} interaction identified between {inter.medicine_a.rxnorm_name} and {inter.medicine_b.rxnorm_name}.",
                }
            )

        has_interactions = len(interactions_payload) > 0

        return {
            "has_interactions": has_interactions,
            "summary": {
                "total_checked": len(medicines),
                "pairs_checked": len(pair_tuples),
                "interactions_found": len(interactions_payload),
                "major": major_count,
                "moderate": moderate_count,
                "minor": minor_count,
            },
            "checked_medicines": checked_meds_payload,
            "interactions": interactions_payload,
        }
