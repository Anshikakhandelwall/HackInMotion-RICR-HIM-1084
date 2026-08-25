from itertools import combinations
from django.db.models import Q
from apps.medicines.models import Medicine, DDInterDrugMapping
from apps.interactions.models import DrugInteraction


# Common brand/generic name aliases → DDInter canonical names
MEDICINE_ALIASES = {
    "aspirin": "Acetylsalicylic acid",
    "paracetamol": "Acetaminophen",
    "tylenol": "Acetaminophen",
    "advil": "Ibuprofen",
    "motrin": "Ibuprofen",
    "aleve": "Naproxen",
    "vitamin k": "Phytomenadione",
    "coumadin": "Warfarin",
    "plavix": "Clopidogrel",
    "lipitor": "Atorvastatin",
    "zocor": "Simvastatin",
    "crestor": "Rosuvastatin",
    "prozac": "Fluoxetine",
    "zoloft": "Sertraline",
    "xanax": "Alprazolam",
    "valium": "Diazepam",
    "ambien": "Zolpidem",
    "viagra": "Sildenafil",
    "cialis": "Tadalafil",
    "metformin": "Metformin",
    "glucophage": "Metformin",
}


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

            # 0. Resolve common brand/alias names to DDInter canonical names
            canonical = MEDICINE_ALIASES.get(item_str.lower())
            if canonical:
                mapping = DDInterDrugMapping.objects.filter(
                    ddinter_drug_name__iexact=canonical,
                    mapping_status="matched",
                ).select_related("medicine").first()
                if mapping:
                    med = mapping.medicine

            # 1. Try matching by RxCUI
            if not med:
                med = Medicine.objects.filter(rxcui=item_str).first()

            # 2. If digit, try matching by PK ID
            if not med and item_str.isdigit():
                med = Medicine.objects.filter(pk=int(item_str)).first()

            # 3. Try exact/case-insensitive match by rxnorm_name
            if not med:
                med = Medicine.objects.filter(rxnorm_name__iexact=item_str).first()

            # 4. Try DDInter mapping lookup (exact)
            if not med:
                mapping = DDInterDrugMapping.objects.filter(
                    ddinter_drug_name__iexact=item_str,
                    mapping_status="matched",
                ).select_related("medicine").first()
                if mapping:
                    med = mapping.medicine

            # 5. Try partial DDInter name match — input may be a substring of the
            #    DDInter canonical name (e.g. "Warfarin" inside "Warfarin sodium").
            if not med:
                mapping = DDInterDrugMapping.objects.filter(
                    ddinter_drug_name__icontains=item_str,
                    mapping_status="matched",
                ).select_related("medicine").first()
                if mapping:
                    med = mapping.medicine

            # 6. Try DB name contains input (short generic inside longer input is
            #    handled in step 7 below — this catches the reverse direction first).
            if not med:
                med = Medicine.objects.filter(
                    rxnorm_name__icontains=item_str
                ).first()

            # 7. Full drug-name string from RxNorm/search (e.g. "Warfarin 5 MG Oral
            #    Tablet"): extract each word token and try to resolve the first
            #    meaningful token. This handles the common case where the user selects
            #    a full RxNorm concept name from the search dropdown and the local DB
            #    only stores the bare generic name ("warfarin").
            if not med and len(item_str.split()) > 1:
                tokens = item_str.split()
                for token in tokens:
                    # Skip dose/form tokens that are never drug names
                    if token.upper() in {
                        'MG', 'MCG', 'ML', 'TABLET', 'ORAL', 'CAPSULE',
                        'SOLUTION', 'INJECTION', 'TOPICAL', 'PATCH',
                        'EXTENDED', 'RELEASE', 'DELAYED', 'PRODUCT',
                    }:
                        continue
                    # Try alias first
                    alias_hit = MEDICINE_ALIASES.get(token.lower())
                    if alias_hit:
                        mapping = DDInterDrugMapping.objects.filter(
                            ddinter_drug_name__iexact=alias_hit,
                            mapping_status="matched",
                        ).select_related("medicine").first()
                        if mapping:
                            med = mapping.medicine
                            break
                    # Try exact rxnorm_name
                    candidate = Medicine.objects.filter(
                        rxnorm_name__iexact=token
                    ).first()
                    if candidate:
                        med = candidate
                        break
                    # Try DDInter exact
                    mapping = DDInterDrugMapping.objects.filter(
                        ddinter_drug_name__iexact=token,
                        mapping_status="matched",
                    ).select_related("medicine").first()
                    if mapping:
                        med = mapping.medicine
                        break
                    # Try DB name contains token (only for tokens ≥ 4 chars)
                    if len(token) >= 4:
                        candidate = Medicine.objects.filter(
                            rxnorm_name__icontains=token
                        ).first()
                        if candidate:
                            med = candidate
                            break

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
