import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

INPUT_FILE = BASE_DIR / "data" / "interactions" / "DDInter_processed.csv"
OUTPUT_FILE = BASE_DIR / "data" / "interactions" / "ddinter_unique_drugs.csv"

df = pd.read_csv(INPUT_FILE)

# Get every drug appearing in either side of an interaction
drugs_a = df["Drug_A"].dropna()
drugs_b = df["Drug_B"].dropna()

unique_drugs = pd.concat([drugs_a, drugs_b]).drop_duplicates()

unique_drugs = unique_drugs.sort_values().reset_index(drop=True)

result = pd.DataFrame({
    "ddinter_drug_name": unique_drugs
})

result.to_csv(OUTPUT_FILE, index=False)

print("DDInter unique drug extraction complete")
print("---------------------------------------")
print(f"Total interaction records : {len(df)}")
print(f"Unique drug names         : {len(result)}")
print(f"Output                    : {OUTPUT_FILE}")

print("\nFirst 20 drugs:")
print(result.head(20).to_string(index=False))