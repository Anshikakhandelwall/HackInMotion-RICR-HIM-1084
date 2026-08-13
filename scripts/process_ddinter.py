import pandas as pd
from pathlib import Path


# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

RAW_FILE = BASE_DIR / "data" / "interactions" / "DDInter_raw.csv"
OUTPUT_FILE = BASE_DIR / "data" / "interactions" / "DDInter_processed.csv"


# --------------------------------------------------
# Load dataset
# --------------------------------------------------

print("Loading DDInter dataset...")

df = pd.read_csv(RAW_FILE)

print(f"Original records: {len(df)}")


# --------------------------------------------------
# Clean column names
# --------------------------------------------------

df.columns = df.columns.str.strip()


# --------------------------------------------------
# Remove completely empty rows
# --------------------------------------------------

df = df.dropna(
    subset=[
        "DDInterID_A",
        "Drug_A",
        "DDInterID_B",
        "Drug_B",
        "Level"
    ]
)


# --------------------------------------------------
# Clean text fields
# --------------------------------------------------

for column in ["DDInterID_A", "Drug_A", "DDInterID_B", "Drug_B", "Level"]:
    df[column] = df[column].astype(str).str.strip()


# --------------------------------------------------
# Normalize severity
# --------------------------------------------------

df["Level"] = df["Level"].str.title()


# --------------------------------------------------
# Keep only valid severity levels
# --------------------------------------------------

valid_levels = ["Major", "Moderate", "Minor"]

df = df[df["Level"].isin(valid_levels)]


# --------------------------------------------------
# Create canonical drug pair
#
# This ensures:
#
# Drug A + Drug B
# and
# Drug B + Drug A
#
# are treated as the same pair.
# --------------------------------------------------

def canonical_pair(row):
    drug1 = row["Drug_A"]
    drug2 = row["Drug_B"]

    if drug1.lower() <= drug2.lower():
        return pd.Series([drug1, drug2])
    else:
        return pd.Series([drug2, drug1])


df[["Drug_1", "Drug_2"]] = df.apply(
    canonical_pair,
    axis=1
)


# --------------------------------------------------
# Remove duplicate drug pairs
#
# Keep the first DDInter record for each pair.
# --------------------------------------------------

before_duplicates = len(df)

df = df.drop_duplicates(
    subset=["Drug_1", "Drug_2"],
    keep="first"
)

duplicates_removed = before_duplicates - len(df)


# --------------------------------------------------
# Reorder columns
# --------------------------------------------------

df = df[
    [
        "DDInterID_A",
        "Drug_A",
        "DDInterID_B",
        "Drug_B",
        "Drug_1",
        "Drug_2",
        "Level"
    ]
]


# --------------------------------------------------
# Save processed dataset
# --------------------------------------------------

df.to_csv(
    OUTPUT_FILE,
    index=False
)


# --------------------------------------------------
# Summary
# --------------------------------------------------

print("\nProcessing complete!")
print("--------------------------------")
print(f"Original records       : {before_duplicates + duplicates_removed}")
print(f"Duplicates removed     : {duplicates_removed}")
print(f"Final records          : {len(df)}")
print(f"Output file            : {OUTPUT_FILE}")

print("\nSeverity distribution:")
print(df["Level"].value_counts())

print("\nFirst 5 processed records:")
print(df.head())