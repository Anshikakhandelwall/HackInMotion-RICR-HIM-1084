import pandas as pd
import requests
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

INPUT_FILE = BASE_DIR / "data" / "interactions" / "ddinter_unique_drugs.csv"
OUTPUT_FILE = BASE_DIR / "data" / "interactions" / "ddinter_rxnorm_mapping.csv"

BASE_URL = "https://rxnav.nlm.nih.gov/REST"


def exact_or_normalized_search(drug_name):
    """
    Try RxNorm exact/normalized search.
    """
    url = f"{BASE_URL}/rxcui.json"

    params = {
        "name": drug_name,
        "search": "2"
    }

    try:
        response = requests.get(url, params=params, timeout=10)

        if response.status_code != 200:
            return None

        data = response.json()

        ids = data.get("idGroup", {}).get("rxnormId", [])

        if ids:
            return ids[0]

    except requests.RequestException:
        pass

    return None


def approximate_search(drug_name):
    """
    Try RxNorm approximate matching when exact/normalized
    search does not find a result.
    """
    url = f"{BASE_URL}/approximateTerm.json"

    params = {
        "term": drug_name,
        "maxEntries": 5,
        "option": 1
    }

    try:
        response = requests.get(url, params=params, timeout=10)

        if response.status_code != 200:
            return None, None

        data = response.json()

        candidates = (
            data.get("approximateGroup", {})
            .get("candidate", [])
        )

        if not candidates:
            return None, None

        # First candidate is the best-ranked candidate
        best = candidates[0]

        return best.get("rxcui"), best.get("name")

    except requests.RequestException:
        pass

    return None, None


def get_rxnorm_properties(rxcui):
    """
    Get the RxNorm concept name and term type.
    """
    url = f"{BASE_URL}/rxcui/{rxcui}/properties.json"

    try:
        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            return None, None

        data = response.json()

        properties = data.get("properties")

        if properties:
            return (
                properties.get("name"),
                properties.get("tty")
            )

    except requests.RequestException:
        pass

    return None, None


def main():

    print("Loading DDInter unique drug list...")

    df = pd.read_csv(INPUT_FILE)

    print(f"Total drugs to map: {len(df)}")
    print("---------------------------------------")

    results = []

    for index, row in df.iterrows():

        drug_name = str(row["ddinter_drug_name"]).strip()

        print(
            f"[{index + 1}/{len(df)}] "
            f"Mapping: {drug_name}"
        )

        # -------------------------------------------------
        # STEP 1: Exact / normalized search
        # -------------------------------------------------

        rxcui = exact_or_normalized_search(drug_name)

        mapping_method = None
        approximate_name = None

        if rxcui:

            mapping_method = "exact_or_normalized"

        else:

            # -------------------------------------------------
            # STEP 2: Approximate search
            # -------------------------------------------------

            rxcui, approximate_name = approximate_search(drug_name)

            if rxcui:
                mapping_method = "approximate"

        # -------------------------------------------------
        # STEP 3: Get RxNorm properties
        # -------------------------------------------------

        rxnorm_name = None
        tty = None

        if rxcui:

            rxnorm_name, tty = get_rxnorm_properties(rxcui)

        # -------------------------------------------------
        # Mapping status
        # -------------------------------------------------

        if rxcui:

            status = "matched"

        else:

            status = "not_found"

        results.append({
            "ddinter_drug_name": drug_name,
            "rxcui": rxcui,
            "rxnorm_name": rxnorm_name or approximate_name,
            "tty": tty,
            "mapping_method": mapping_method,
            "mapping_status": status
        })

        # Small delay between API requests
        time.sleep(0.15)

        # Save progress every 100 drugs
        if (index + 1) % 100 == 0:

            temp_df = pd.DataFrame(results)
            temp_df.to_csv(OUTPUT_FILE, index=False)

            print(
                f"\nProgress saved: "
                f"{index + 1}/{len(df)}\n"
            )

    # Final output

    result_df = pd.DataFrame(results)

    result_df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("\n=======================================")
    print("RxNorm mapping complete!")
    print("=======================================")

    print(f"Total DDInter drugs : {len(result_df)}")

    print(
        f"Matched             : "
        f"{(result_df['mapping_status'] == 'matched').sum()}"
    )

    print(
        f"Not found           : "
        f"{(result_df['mapping_status'] == 'not_found').sum()}"
    )

    print("\nMapping method:")
    print(
        result_df["mapping_method"]
        .value_counts(dropna=False)
    )

    print("\nOutput:")
    print(OUTPUT_FILE)


if __name__ == "__main__":
    main()