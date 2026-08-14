"""
Audit script — read-only. Identifies the 17 DDInter name-pairs that
collapse to the same canonical Medicine pk pair after RxNorm mapping.
Makes no database changes.
"""

import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

import pandas as pd
from apps.medicines.models import DDInterDrugMapping, Medicine
from apps.interactions.models import DrugInteraction

# --------------------------------------------------
# Build lookup: ddinter_drug_name -> (medicine_id, rxcui, rxnorm_name)
# --------------------------------------------------
name_to_med = {}
for m in DDInterDrugMapping.objects.select_related("medicine").only(
    "ddinter_drug_name", "medicine__id", "medicine__rxcui", "medicine__rxnorm_name"
):
    name_to_med[m.ddinter_drug_name] = (
        m.medicine_id,
        m.medicine.rxcui,
        m.medicine.rxnorm_name,
    )

# --------------------------------------------------
# Walk the CSV and track the first DDInter name-pair
# that occupies each canonical (a_id, b_id) slot
# --------------------------------------------------
df = pd.read_csv(
    os.path.join(PROJECT_ROOT, "data", "interactions", "DDInter_processed.csv"),
    dtype=str,
)

seen = {}       # canonical (a_id, b_id) -> first-row info dict
collisions = []
tolevamer_rows = 0

for _, row in df.iterrows():
    d1 = str(row["Drug_1"]).strip()
    d2 = str(row["Drug_2"]).strip()
    level = str(row["Level"]).strip()

    r1 = name_to_med.get(d1)
    r2 = name_to_med.get(d2)

    if r1 is None or r2 is None:
        tolevamer_rows += 1
        continue

    pk1, rxcui1, rname1 = r1
    pk2, rxcui2, rname2 = r2

    # Canonicalise to lower pk first
    if pk1 <= pk2:
        a_id, b_id     = pk1, pk2
        a_rxcui, b_rxcui     = rxcui1, rxcui2
        a_rname, b_rname     = rname1, rname2
        a_drug, b_drug       = d1, d2
    else:
        a_id, b_id     = pk2, pk1
        a_rxcui, b_rxcui     = rxcui2, rxcui1
        a_rname, b_rname     = rname2, rname1
        a_drug, b_drug       = d2, d1

    key = (a_id, b_id)

    if key in seen:
        collisions.append({
            "csv_drug_1":      d1,
            "csv_drug_2":      d2,
            "csv_rxcui_1":     rxcui1,
            "csv_rxcui_2":     rxcui2,
            "canon_a_rxcui":   a_rxcui,
            "canon_a_name":    a_rname,
            "canon_b_rxcui":   b_rxcui,
            "canon_b_name":    b_rname,
            "level":           level,
            "first_drug_1":    seen[key]["drug_1"],
            "first_drug_2":    seen[key]["drug_2"],
            "first_level":     seen[key]["level"],
        })
    else:
        seen[key] = {"drug_1": a_drug, "drug_2": b_drug, "level": level}

# --------------------------------------------------
# Print report
# --------------------------------------------------
print()
print("=" * 72)
print("  COLLISION AUDIT: DDInter name-pairs -> same canonical Medicine pair")
print("=" * 72)
print(f"  Total CSV rows          : {len(df)}")
print(f"  Tolevamer rows skipped  : {tolevamer_rows}")
print(f"  Valid name-pairs        : {len(df) - tolevamer_rows}")
print(f"  Unique canonical pairs  : {len(seen)}")
print(f"  Collapsed (collisions)  : {len(collisions)}")
print()

for i, c in enumerate(collisions, 1):
    print(f"  [{i:02d}] CSV row (collapsed)")
    print(f"        Drug_1          : {c['csv_drug_1']} (RxCUI {c['csv_rxcui_1']})")
    print(f"        Drug_2          : {c['csv_drug_2']} (RxCUI {c['csv_rxcui_2']})")
    print(f"        Level           : {c['level']}")
    print(f"        Canonical pair  : {c['canon_a_name']} (RxCUI {c['canon_a_rxcui']})")
    print(f"                        + {c['canon_b_name']} (RxCUI {c['canon_b_rxcui']})")
    print(f"        Already stored as:")
    print(f"          Drug_1        : {c['first_drug_1']}")
    print(f"          Drug_2        : {c['first_drug_2']}")
    print(f"          Level         : {c['first_level']}")
    print()

# --------------------------------------------------
# Confirm database counts are unchanged
# --------------------------------------------------
di_count  = DrugInteraction.objects.count()
med_count = Medicine.objects.count()
map_count = DDInterDrugMapping.objects.count()

print("=" * 72)
print("  DATABASE COUNTS (read-only confirmation)")
print("=" * 72)
print(f"  DrugInteraction count   : {di_count}   (expected 10874)")
print(f"  Medicine count          : {med_count}    (expected 1400)")
print(f"  DDInterDrugMapping count: {map_count}    (expected 1405)")
print("=" * 72)
