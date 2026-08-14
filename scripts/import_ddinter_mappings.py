"""
import_ddinter_mappings.py
--------------------------
Imports all matched DDInter drug name → canonical Medicine mappings into
the `ddinter_drug_mappings` table.

Run from the repository root:
    python scripts/import_ddinter_mappings.py

Safe to run multiple times — existing ddinter_drug_name rows are skipped.
The entire insert is wrapped in a transaction so a failure leaves the
mapping table unchanged.

Expected result:
    DDInterDrugMapping count : 1405
    Medicine count           : 1400  (unchanged)
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

from apps.medicines.models import DDInterDrugMapping, Medicine


# --------------------------------------------------
# File path
# --------------------------------------------------

MAPPING_FILE = os.path.join(
    PROJECT_ROOT,
    "data",
    "interactions",
    "ddinter_rxnorm_mapping.csv",
)


# --------------------------------------------------
# Load CSV (read as str to avoid float rxcui artifacts)
# --------------------------------------------------

print("-" * 48)
print("DDInter mapping import")
print("-" * 48)

df = pd.read_csv(MAPPING_FILE, dtype=str)

total_rows = len(df)
print(f"Total CSV rows      : {total_rows}")


# --------------------------------------------------
# Filter: matched rows only
# (Tolevamer has mapping_status == "not_found" and is excluded here)
# --------------------------------------------------

matched_df = df[df["mapping_status"].str.strip() == "matched"].copy()
unmatched_df = df[df["mapping_status"].str.strip() != "matched"]

matched_rows = len(matched_df)
unmatched_rows = len(unmatched_df)

print(f"Matched rows        : {matched_rows}")
print(f"Unmatched rows      : {unmatched_rows}")

if unmatched_rows > 0:
    names = unmatched_df["ddinter_drug_name"].tolist()
    print(f"  Unmatched names   : {names}")


# --------------------------------------------------
# Sanitise rxcui: strip whitespace and trailing ".0"
# --------------------------------------------------

def clean_rxcui(val: str) -> str:
    val = val.strip()
    if val.endswith(".0"):
        val = val[:-2]
    return val

matched_df["rxcui"] = matched_df["rxcui"].apply(clean_rxcui)


# --------------------------------------------------
# Drop rows with a missing/empty rxcui (safety check)
# --------------------------------------------------

before = len(matched_df)
matched_df = matched_df[
    matched_df["rxcui"].notna() & (matched_df["rxcui"].str.strip() != "")
].copy()
after = len(matched_df)

if before != after:
    print(f"  WARNING: dropped {before - after} matched rows with missing rxcui")


# --------------------------------------------------
# Build a lookup: rxcui → Medicine (from existing DB rows)
# --------------------------------------------------

rxcui_to_medicine = {
    m.rxcui: m
    for m in Medicine.objects.all()
}

print(f"\nMedicines in DB     : {len(rxcui_to_medicine)}")


# --------------------------------------------------
# Determine which ddinter_drug_names already exist
# --------------------------------------------------

existing_names = set(
    DDInterDrugMapping.objects.values_list("ddinter_drug_name", flat=True)
)

print(f"Existing mappings   : {len(existing_names)}")


# --------------------------------------------------
# Build objects for insertion, reporting any problems
# --------------------------------------------------

to_insert = []
missing_medicines = []

for _, row in matched_df.iterrows():
    name = str(row["ddinter_drug_name"]).strip()
    rxcui = row["rxcui"]

    # Skip if already imported
    if name in existing_names:
        continue

    # Resolve to existing Medicine — never create a new one
    medicine = rxcui_to_medicine.get(rxcui)
    if medicine is None:
        missing_medicines.append((name, rxcui))
        continue

    method = str(row.get("mapping_method", "")).strip()
    if method in ("", "nan"):
        method = ""

    to_insert.append(
        DDInterDrugMapping(
            ddinter_drug_name=name,
            medicine=medicine,
            mapping_method=method,
            mapping_status="matched",
        )
    )

print(f"New mappings        : {len(to_insert)}")
print(f"Missing Medicines   : {len(missing_medicines)}")

if missing_medicines:
    print("\n  ERROR: the following RxCUIs from the CSV have no Medicine in the DB:")
    for n, r in missing_medicines:
        print(f"    {n!r} → rxcui={r!r}")
    print("\n  Run scripts/import_medicines.py first, then retry.")
    sys.exit(1)


# --------------------------------------------------
# Bulk insert inside a transaction
#
# bulk_create + ignore_conflicts=True:
#   - One INSERT per batch of 500 rows (single round-trip)
#   - ON CONFLICT DO NOTHING handles any race between the pre-filter
#     and the actual INSERT
#   - transaction.atomic() rolls back everything if an unexpected error
#     occurs mid-import, leaving the table in a clean state
# --------------------------------------------------

if to_insert:
    with transaction.atomic():
        DDInterDrugMapping.objects.bulk_create(
            to_insert,
            batch_size=500,
            ignore_conflicts=True,
        )

final_count = DDInterDrugMapping.objects.count()

print()
print("-" * 48)
print("Import complete")
print("-" * 48)
print(f"DDInterDrugMapping count : {final_count}")
print(f"Medicine count           : {Medicine.objects.count()}")
