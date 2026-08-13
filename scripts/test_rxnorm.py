import requests

BASE_URL = "https://rxnav.nlm.nih.gov/REST"


def search_medicine(name):
    url = f"{BASE_URL}/rxcui.json"

    params = {
        "name": name,
        "search": 2
    }

    response = requests.get(url, params=params, timeout=10)

    print(f"\nSearching: {name}")
    print(f"Status: {response.status_code}")
    print(f"URL: {response.url}")

    response.raise_for_status()

    data = response.json()

    print("Response:")
    print(data)

    return data


def approximate_search(name):
    url = f"{BASE_URL}/approximateTerm.json"

    params = {
        "term": name,
        "maxEntries": 5,
        "option": 1
    }

    response = requests.get(url, params=params, timeout=10)

    print(f"\nApproximate search: {name}")
    print(f"Status: {response.status_code}")
    print(f"URL: {response.url}")

    response.raise_for_status()

    data = response.json()

    print("Response:")
    print(data)

    return data


if __name__ == "__main__":

    # 1. Normal search
    search_medicine("paracetamol")

    # 2. Brand-name search
    search_medicine("Dolo 650")

    # 3. Misspelling / approximate search
    approximate_search("paracetmol")