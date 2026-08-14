import os
import sys

import pandas as pd
import django


# Add backend directory to Python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

sys.path.insert(0, BACKEND_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

django.setup()

from apps.medicines.models import Medicine


CSV_PATH = os.path.join(
    BASE_DIR,
    "data",
    "interactions",
    "ddinter_rxnorm_mapping.csv",
)


print("Loading RxNorm mapping...")
df = pd.read_csv(CSV_PATH)

print(f"Total mapping records: {len(df)}")


# Only use successfully mapped medicines
df = df[df["mapping_status"] == "matched"].copy()

# Remove rows without an RxCUI
df = df.dropna(subset=["rxcui"])

# RxCUI should be stored as a string
df["rxcui"] = df["rxcui"].astype(float).astype(int).astype(str)

# Remove duplicate RxCUIs
df = df.drop_duplicates(subset=["rxcui"])

print(f"Unique canonical medicines: {len(df)}")


created_count = 0
updated_count = 0


for _, row in df.iterrows():
    medicine, created = Medicine.objects.update_or_create(
        rxcui=row["rxcui"],
        defaults={
            "rxnorm_name": row["rxnorm_name"],
            "tty": row["tty"] if pd.notna(row["tty"]) else "",
        },
    )

    if created:
        created_count += 1
    else:
        updated_count += 1


print()
print("--------------------------------")
print("Medicine import complete")
print("--------------------------------")
print(f"Created : {created_count}")
print(f"Updated : {updated_count}")
print(f"Database total : {Medicine.objects.count()}")