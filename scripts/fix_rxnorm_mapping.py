import pandas as pd

INPUT = "data/interactions/ddinter_rxnorm_mapping.csv"
OUTPUT = "data/interactions/ddinter_rxnorm_mapping.csv"

manual_mappings = {
    "Midazolam": {
        "rxcui": 6960,
        "rxnorm_name": "midazolam",
        "tty": "IN",
    },
    "Midodrine": {
        "rxcui": 6963,
        "rxnorm_name": "midodrine",
        "tty": "IN",
    },
    "Sparfloxacin": {
        "rxcui": 18469,
        "rxnorm_name": "sparfloxacin",
        "tty": "IN",
    },
    "Spironolactone": {
        "rxcui": 9997,
        "rxnorm_name": "spironolactone",
        "tty": "IN",
    },
}

df = pd.read_csv(INPUT)
df["rxcui"] = df["rxcui"].astype("Int64")
for drug, mapping in manual_mappings.items():
    mask = (
        df["ddinter_drug_name"]
        .str.strip()
        .str.lower()
        == drug.lower()
    )

    df.loc[mask, "rxcui"] = mapping["rxcui"]
    df.loc[mask, "rxnorm_name"] = mapping["rxnorm_name"]
    df.loc[mask, "tty"] = mapping["tty"]
    df.loc[mask, "mapping_method"] = "approximate_manual_verified"
    df.loc[mask, "mapping_status"] = "matched"

df.to_csv(OUTPUT, index=False)

print("Mapping updated!")
print("--------------------------------")
print("Total drugs:", len(df))
print("Matched:", (df["mapping_status"] == "matched").sum())
print("Not found:", (df["mapping_status"] != "matched").sum())

print("\nRemaining unmatched:")
print(
    df[df["mapping_status"] != "matched"][
        ["ddinter_drug_name", "rxcui", "mapping_status"]
    ].to_string(index=False)
)