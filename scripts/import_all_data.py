import os
import sys
import csv
import django

# Add backend directory to Python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.medicines.models import Medicine, DDInterDrugMapping
from apps.interactions.models import DrugInteraction


def import_medicines_and_mappings():
    mapping_csv = os.path.join(
        BASE_DIR,
        "data",
        "interactions",
        "ddinter_rxnorm_mapping.csv",
    )

    print("Loading DDInter -> RxNorm mapping CSV...")
    with open(mapping_csv, "r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))

    print(f"Total mapping rows in CSV: {len(reader)}")

    # 1. Import canonical Medicines
    existing_meds = {m.rxcui: m for m in Medicine.objects.all()}
    med_obj_map = dict(existing_meds)
    seen_rxcuis = set(existing_meds.keys())
    medicines_to_create = []

    for row in reader:
        status = row.get("mapping_status", "").strip()
        rxcui_raw = row.get("rxcui", "").strip()

        if status == "matched" and rxcui_raw:
            try:
                rxcui_str = str(int(float(rxcui_raw)))
            except ValueError:
                continue

            if rxcui_str not in seen_rxcuis:
                seen_rxcuis.add(rxcui_str)
                rxnorm_name = row.get("rxnorm_name", "").strip()
                tty = row.get("tty", "").strip()
                medicines_to_create.append(
                    Medicine(
                        rxcui=rxcui_str,
                        rxnorm_name=rxnorm_name,
                        tty=tty,
                    )
                )

    if medicines_to_create:
        created_meds = Medicine.objects.bulk_create(medicines_to_create)
        for med in created_meds:
            med_obj_map[med.rxcui] = med
        print(f"Created {len(created_meds)} Medicine records.")

    # Refresh map of all medicines
    for m in Medicine.objects.all():
        med_obj_map[m.rxcui] = m

    print(f"Total canonical medicines in DB: {len(med_obj_map)}")

    # 2. Import DDInterDrugMappings
    existing_mappings = {m.ddinter_drug_name for m in DDInterDrugMapping.objects.all()}
    mappings_to_create = []

    for row in reader:
        drug_name = row.get("ddinter_drug_name", "").strip()
        if not drug_name or drug_name in existing_mappings:
            continue

        existing_mappings.add(drug_name)

        rxcui_raw = row.get("rxcui", "").strip()
        med_obj = None

        if rxcui_raw:
            try:
                rxcui_str = str(int(float(rxcui_raw)))
                med_obj = med_obj_map.get(rxcui_str)
            except ValueError:
                med_obj = None

        status = row.get("mapping_status", "").strip() or "matched"
        method = row.get("mapping_method", "").strip()

        # DDInterDrugMapping in main model schema requires a valid Medicine foreign key for matched
        if status == "matched" and med_obj:
            mappings_to_create.append(
                DDInterDrugMapping(
                    ddinter_drug_name=drug_name,
                    medicine=med_obj,
                    mapping_status=status,
                    mapping_method=method,
                )
            )

    if mappings_to_create:
        DDInterDrugMapping.objects.bulk_create(mappings_to_create)
        print(f"Created {len(mappings_to_create)} DDInterDrugMapping records.")


def import_drug_interactions():
    interactions_csv = os.path.join(
        BASE_DIR,
        "data",
        "interactions",
        "DDInter_processed.csv",
    )

    print("Loading DDInter processed interactions CSV...")
    with open(interactions_csv, "r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))

    print(f"Total processed interaction rows: {len(reader)}")

    mapping_dict = {
        m.ddinter_drug_name.lower(): m.medicine
        for m in DDInterDrugMapping.objects.select_related("medicine").all()
        if m.medicine_id is not None
    }

    existing_pairs = set(
        DrugInteraction.objects.values_list("medicine_a_id", "medicine_b_id")
    )

    interactions_to_create = []
    skipped_unmapped = 0
    skipped_self = 0
    skipped_duplicate = 0

    for row in reader:
        drug1_name = row.get("Drug_1", "").strip().lower()
        drug2_name = row.get("Drug_2", "").strip().lower()
        severity = row.get("Level", "").strip().title()

        med_a = mapping_dict.get(drug1_name)
        med_b = mapping_dict.get(drug2_name)

        if not med_a or not med_b:
            skipped_unmapped += 1
            continue

        if med_a.id == med_b.id:
            skipped_self += 1
            continue

        if med_a.id > med_b.id:
            med_a, med_b = med_b, med_a

        pair_key = (med_a.id, med_b.id)
        if pair_key in existing_pairs:
            skipped_duplicate += 1
            continue

        existing_pairs.add(pair_key)
        interactions_to_create.append(
            DrugInteraction(
                medicine_a=med_a,
                medicine_b=med_b,
                level=severity,
            )
        )

    if interactions_to_create:
        DrugInteraction.objects.bulk_create(interactions_to_create, batch_size=1000)
        print(f"Created {len(interactions_to_create)} DrugInteraction records.")

    if skipped_unmapped or skipped_self or skipped_duplicate:
        print(f"Skipped details: unmapped={skipped_unmapped}, self={skipped_self}, duplicate={skipped_duplicate}")


def verify_database_counts():
    med_count = Medicine.objects.count()
    map_count = DDInterDrugMapping.objects.count()
    interaction_count = DrugInteraction.objects.count()

    matched_map_count = DDInterDrugMapping.objects.filter(mapping_status="matched").count()

    print("\n=========================================")
    print("      DATABASE INTEGRITY REPORT")
    print("=========================================")
    print(f"Medicine Count             : {med_count} (Expected: 1,400)")
    print(f"DDInter Mappings Matched   : {matched_map_count} (Expected: 1,405)")
    print(f"Total Mappings Count       : {map_count} (Expected: 1,405)")
    print(f"DrugInteraction Count      : {interaction_count} (Expected: 10,874)")
    print("=========================================\n")

    assert med_count == 1400, f"Expected 1,400 medicines, found {med_count}"
    assert matched_map_count == 1405, f"Expected 1,405 matched mappings, found {matched_map_count}"
    assert interaction_count == 10874, f"Expected 10,874 interactions, found {interaction_count}"
    print("✅ Verification Passed! All database counts match target metrics exactly.")


if __name__ == "__main__":
    print("Starting data import and verification...")
    import_medicines_and_mappings()
    import_drug_interactions()
    verify_database_counts()
