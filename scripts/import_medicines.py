"""
import_medicines.py
-------------------
Imports canonical RxNorm medicines from the DDInter→RxNorm mapping CSV
into the `medicines` table.

Run from the repository root:
    python scripts/import_medicines.py

Safe to run multiple times — duplicate rxcui values are skipped.
The entire insert is wrapped in a transaction so a failure leaves
the database unchanged.
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

from apps.medicines.models import Medicine


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
# Load CSV
# --------------------------------------------------

print("Loading RxNorm mapping...")

df = pd.read_csv(MAPPING_FILE, dtype=str)   # read everything as str to avoid float rxcui

total_records = len(df)
print(f"  Total mapping records : {total_records}")


# --------------------------------------------------
# Filter: matched rows only
# --------------------------------------------------

df = df[df["mapping_status"].str.strip() == "matched"].copy()
matched_records = len(df)
print(f"  Matched records       : {matched_records}")


# --------------------------------------------------
# Sanitise rxcui
# --------------------------------------------------

# Drop rows where rxcui is missing or empty.
df = df[df["rxcui"].notna() & (df["rxcui"].str.strip() != "")].copy()

# Remove any stray ".0" suffixes that appear when CSV was written from
# a pandas float column (e.g. "6960.0" → "6960").
def clean_rxcui(val: str) -> str:
    val = val.strip()
    if val.endswith(".0"):
        val = val[:-2]
    return val

df["rxcui"] = df["rxcui"].apply(clean_rxcui)


# --------------------------------------------------
# Deduplicate: one row per canonical RxCUI
# --------------------------------------------------

# keep='first' preserves the first occurrence when multiple DDInter names
# map to the same RxCUI (e.g. Estrone / Estrone sulfate → 4103).
df = df.drop_duplicates(subset=["rxcui"], keep="first")

unique_canonical = len(df)
print(f"  Unique canonical RxCUIs: {unique_canonical}")


# --------------------------------------------------
# Determine which RxCUIs already exist (for skip count)
# --------------------------------------------------

existing_rxcuis = set(
    Medicine.objects.values_list("rxcui", flat=True)
)

to_insert = [row for _, row in df.iterrows() if row["rxcui"] not in existing_rxcuis]
already_existing = unique_canonical - len(to_insert)

print(f"\n  Already in DB (will skip) : {already_existing}")
print(f"  New records to insert     : {len(to_insert)}")


# --------------------------------------------------
# Build Medicine objects
# --------------------------------------------------

medicines = [
    Medicine(
        rxcui=row["rxcui"],
        rxnorm_name=str(row["rxnorm_name"]).strip(),
        tty=str(row["tty"]).strip() if pd.notna(row.get("tty")) and str(row["tty"]).strip() not in ("", "nan") else "",
    )
    for row in to_insert
]


# --------------------------------------------------
# Bulk insert inside a transaction
#
# Why bulk_create with ignore_conflicts=True?
# - Sends all rows in one round-trip per batch (batch_size=500),
#   far faster than 1400 individual INSERTs.
# - ignore_conflicts=True maps to PostgreSQL's ON CONFLICT DO NOTHING,
#   so the uniqueness constraint on rxcui acts as the final safety net
#   against races or any rxcui we missed in the pre-filter above.
# - The transaction ensures an unexpected mid-batch error rolls back
#   everything rather than leaving partial data.
# --------------------------------------------------

print("\nImporting into Supabase PostgreSQL...")

with transaction.atomic():
    created = Medicine.objects.bulk_create(
        medicines,
        batch_size=500,
        ignore_conflicts=True,
    )

final_count = Medicine.objects.count()

# bulk_create with ignore_conflicts returns the submitted objects (without
# server-assigned PKs for skipped rows on older Django/psycopg combos).
# The most reliable inserted count is: final_count − previously existing.
inserted = final_count - len(existing_rxcuis)

print()
print("=" * 48)
print("  Medicine import complete")
print("=" * 48)
print(f"  Total mapping records      : {total_records}")
print(f"  Matched records            : {matched_records}")
print(f"  Unique canonical RxCUIs    : {unique_canonical}")
print(f"  Already existed (skipped)  : {already_existing}")
print(f"  Newly inserted             : {inserted}")
print(f"  Database total             : {final_count}")
print("=" * 48)
