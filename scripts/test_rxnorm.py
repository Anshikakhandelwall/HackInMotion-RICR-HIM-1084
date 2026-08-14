import requests

BASE_URL = "https://rxnav.nlm.nih.gov/REST"


def search_medicine(name):
    url = f"{BASE_URL}/rxcui.json"

    params = {
        "name": name,
        "search": 2
    }

    response = requests.get(url, params=params, timeout=10)

    print("\n==============================")
    print(f"Searching: {name}")
    print(f"Status: {response.status_code}")
    print(f"URL: {response.url}")
    print("==============================")

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

    print("\n==============================")
    print(f"Approximate search: {name}")
    print(f"Status: {response.status_code}")
    print(f"URL: {response.url}")
    print("==============================")

    response.raise_for_status()

    data = response.json()

    print("Response:")
    print(data)

    return data


def get_medicine_details(rxcui):
    url = f"{BASE_URL}/rxcui/{rxcui}/properties.json"

    response = requests.get(url, timeout=10)

    print("\n==============================")
    print(f"Medicine details for RxCUI: {rxcui}")
    print(f"Status: {response.status_code}")
    print("==============================")

    response.raise_for_status()

    data = response.json()

    print(data)

    return data


if __name__ == "__main__":

    search_medicine("paracetamol")

    search_medicine("Dolo 650")

    approximate_search("paracetmol")

    get_medicine_details("161")