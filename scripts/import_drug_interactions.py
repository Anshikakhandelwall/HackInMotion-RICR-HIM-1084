"""
import_drug_interactions.py
---------------------------
Imports canonical DrugInteraction records from DDInter_processed.csv into
the `drug_interactions` table via the DDInterDrugMapping → Medicine chain.

Run from the repository root:
    python scripts/import_drug_interactions.py

Safe to run multiple times — duplicate pairs are skipped.

Expected final state:
    DrugInteraction total : 10,891
    Major                 :  2,738
    Moderate              :  7,353
    Minor                 :    800
    Skipped (Tolevamer)   :      7
"""

import os
import sys

import django

# --------------------------------------------------
# Django setup — must happen before any app imports
# --------------------------------------------------

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

sys.path.insert(0, BACKEND_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

django.setup()

# --------------------------------------------------
# Imports that require Django to be set up first
# --------------------------------------------------

import pandas as pd
from django.db import transaction

from apps.interactions.models import DrugInteraction
from apps.medicines.models import DDInterDrugMapping

# --------------------------------------------------
# File path
# --------------------------------------------------

CSV_FILE = os.path.join(
    PROJECT_ROOT,
    "data",
    "interactions",
    "DDInter_processed.csv",
)

# --------------------------------------------------
# Load CSV
# --------------------------------------------------

print("Loading DDInter_processed.csv ...")
df = pd.read_csv(CSV_FILE, dtype=str)
total_rows = len(df)
print(f"  Total rows: {total_rows}")

# --------------------------------------------------
# Build DDInter name → Medicine pk lookup from the
# already-imported DDInterDrugMapping table.
# One DB query; result held in memory (~1,405 entries).
# --------------------------------------------------

name_to_medicine_pk = {
    row["ddinter_drug_name"]: row["medicine_id"]
    for row in DDInterDrugMapping.objects.values("ddinter_drug_name", "medicine_id")
}

print(f"  DDInterDrugMapping entries loaded: {len(name_to_medicine_pk)}")

# --------------------------------------------------
# Build the set of (medicine_a_id, medicine_b_id) pairs
# that already exist in the DB, so we can skip them
# without hitting the DB once per row.
# --------------------------------------------------

existing_pairs = set(
    DrugInteraction.objects.values_list("medicine_a_id", "medicine_b_id")
)
print(f"  Existing DrugInteraction rows: {len(existing_pairs)}")

# --------------------------------------------------
# Iterate rows and build objects to insert
# --------------------------------------------------

to_insert = []
skipped_rows = 0
missing_names: set[str] = set()

for _, row in df.iterrows():
    drug1 = str(row["Drug_1"]).strip()
    drug2 = str(row["Drug_2"]).strip()

    pk1 = name_to_medicine_pk.get(drug1)
    pk2 = name_to_medicine_pk.get(drug2)

    if pk1 is None or pk2 is None:
        skipped_rows += 1
        if pk1 is None:
            missing_names.add(drug1)
        if pk2 is None:
            missing_names.add(drug2)
        continue

    # Canonicalise pair: lower pk → medicine_a
    a_id, b_id = (pk1, pk2) if pk1 < pk2 else (pk2, pk1)

    if (a_id, b_id) in existing_pairs:
        continue

    level_raw = str(row["Level"]).strip()
    # Map CSV value to the exact TextChoices value stored in the model
    level_map = {
        "Major": DrugInteraction.Severity.MAJOR,
        "Moderate": DrugInteraction.Severity.MODERATE,
        "Minor": DrugInteraction.Severity.MINOR,
    }
    level = level_map.get(level_raw)
    if level is None:
        print(f"  WARNING: unrecognised severity {level_raw!r} for {drug1}/{drug2} — skipping")
        skipped_rows += 1
        continue

    to_insert.append(
        DrugInteraction(
            medicine_a_id=a_id,
            medicine_b_id=b_id,
            level=level,
        )
    )
    # Track locally so duplicate CSV rows within this run don't double-insert
    existing_pairs.add((a_id, b_id))

# --------------------------------------------------
# Bulk insert inside a transaction
#
# bulk_create + ignore_conflicts=True:
#   - Batches of 500 rows → far fewer round-trips than individual saves
#   - ON CONFLICT DO NOTHING on (medicine_a_id, medicine_b_id) is the
#     final safety net for any pair we might have missed above
#   - transaction.atomic() rolls everything back on unexpected error
# --------------------------------------------------

print(f"\n  New interactions to insert: {len(to_insert)}")

if to_insert:
    with transaction.atomic():
        DrugInteraction.objects.bulk_create(
            to_insert,
            batch_size=500,
            ignore_conflicts=True,
        )

# --------------------------------------------------
# Summary
# --------------------------------------------------

from django.db.models import Count

final_count = DrugInteraction.objects.count()
new_inserted = final_count - len(existing_pairs) + len(to_insert)  # robust count
severity_counts = (
    DrugInteraction.objects
    .values("level")
    .annotate(n=Count("id"))
    .order_by("level")
)
severity_map = {s["level"]: s["n"] for s in severity_counts}

existing_skipped = (total_rows - skipped_rows) - len(to_insert)

print()
print("=" * 49)
print("  DrugInteraction import complete")
print("=" * 49)
print(f"  Total CSV rows             : {total_rows}")
print(f"  Valid interaction rows     : {total_rows - skipped_rows}")
print(f"  Skipped rows               : {skipped_rows}")
print(f"  Missing mapping names      : {sorted(missing_names)}")
print(f"  New interactions inserted  : {len(to_insert)}")
print(f"  Existing interactions skipped: {existing_skipped}")
print(f"  Final DrugInteraction count: {final_count}")
print("=" * 49)
print(f"  Major    : {severity_map.get('Major', 0)}")
print(f"  Moderate : {severity_map.get('Moderate', 0)}")
print(f"  Minor    : {severity_map.get('Minor', 0)}")
print("=" * 49)
