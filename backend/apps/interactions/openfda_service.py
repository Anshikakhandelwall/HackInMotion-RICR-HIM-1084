"""
openFDA Drug Label API service.

Responsibilities:
  - Search the openFDA drug/label.json endpoint by medicine name.
  - Normalize the raw openFDA response into a clean application-level structure.
  - Handle all error conditions (not found, timeout, HTTP failure, missing key).
  - Never expose the API key in responses, logs, or exceptions.

This service is a supporting evidence source alongside DDInter/RxNorm.
It does NOT replace the core DDI pipeline.

Official docs: https://open.fda.gov/apis/drug/label/
"""

import logging
import urllib.parse
import urllib.request
import urllib.error
import json

from django.conf import settings

logger = logging.getLogger(__name__)

OPENFDA_LABEL_URL = "https://api.fda.gov/drug/label.json"
_REQUEST_TIMEOUT = 5  # seconds


def _get_api_key() -> str:
    """
    Return the openFDA API key from Django settings.
    Raises ValueError if not configured — callers convert this to a safe HTTP error.
    Never logs or surfaces the key value.
    """
    key = getattr(settings, "OPENFDA_API_KEY", None)
    if not key:
        raise ValueError("OPENFDA_API_KEY is not configured on the server.")
    return key


def _extract_first(field, default=""):
    """Return the first element of a list, or default if absent/empty."""
    if isinstance(field, list) and field:
        return field[0]
    return default


def _normalize_label(raw_result: dict, drug_name: str) -> dict:
    """
    Convert a single openFDA label result into the application's normalized shape.
    Missing fields return empty strings / empty lists — never raises.
    """
    openfda = raw_result.get("openfda", {})

    return {
        "found": True,
        "drug_name": drug_name,
        "generic_name": _extract_first(
            openfda.get("generic_name") or raw_result.get("generic_name")
        ),
        "brand_name": _extract_first(
            openfda.get("brand_name") or raw_result.get("brand_name")
        ),
        "rxcui": _extract_first(openfda.get("rxcui")),
        "drug_interactions": _extract_first(raw_result.get("drug_interactions"), [])
            if isinstance(raw_result.get("drug_interactions"), list)
            else [],
        "warnings": _extract_first(raw_result.get("warnings"), [])
            if isinstance(raw_result.get("warnings"), list)
            else [],
        "precautions": _extract_first(raw_result.get("precautions"), [])
            if isinstance(raw_result.get("precautions"), list)
            else [],
        "adverse_reactions": _extract_first(raw_result.get("adverse_reactions"), [])
            if isinstance(raw_result.get("adverse_reactions"), list)
            else [],
        "source": "openFDA",
    }


def _not_found(drug_name: str) -> dict:
    return {
        "found": False,
        "drug_name": drug_name,
        "source": "openFDA",
    }


def fetch_drug_label(drug_name: str) -> dict:
    """
    Search openFDA for drug label information by medicine name.

    Search strategy (in order of preference):
      1. openfda.generic_name (most reliable normalized name)
      2. openfda.brand_name (catches brand-only entries)
      3. openfda.substance_name (catches ingredient-level entries)

    Returns a normalized dict.  Never raises — all errors are handled and
    returned as structured results so callers can respond cleanly.

    The API key is attached as a query parameter and is never logged.
    """
    if not drug_name or not drug_name.strip():
        return _not_found(drug_name or "")

    clean_name = drug_name.strip()

    try:
        api_key = _get_api_key()
    except ValueError:
        logger.error("openFDA: API key not configured.")
        # Signal a configuration error to the caller without leaking details.
        raise

    # Try three search fields in priority order; return on first hit.
    search_fields = [
        f'openfda.generic_name:"{clean_name}"',
        f'openfda.brand_name:"{clean_name}"',
        f'openfda.substance_name:"{clean_name}"',
    ]

    for search_expr in search_fields:
        params = urllib.parse.urlencode({
            "search": search_expr,
            "limit": "1",
            "api_key": api_key,
        })
        url = f"{OPENFDA_LABEL_URL}?{params}"

        try:
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=_REQUEST_TIMEOUT) as resp:
                body = json.loads(resp.read().decode("utf-8"))
                results = body.get("results", [])
                if results:
                    return _normalize_label(results[0], clean_name)

        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                # 404 from openFDA means no match for this search field — try next.
                continue
            # Log only the status code, never the URL (contains key).
            logger.warning("openFDA: HTTP %s while searching for drug label.", exc.code)
            raise OpenFDAError(f"openFDA returned HTTP {exc.code}.") from exc

        except urllib.error.URLError as exc:
            logger.warning("openFDA: network error — %s", type(exc.reason).__name__)
            raise OpenFDAUnavailableError("openFDA is currently unreachable.") from exc

        except TimeoutError as exc:
            logger.warning("openFDA: request timed out.")
            raise OpenFDAUnavailableError("openFDA request timed out.") from exc

        except (json.JSONDecodeError, KeyError) as exc:
            logger.warning("openFDA: malformed response — %s", type(exc).__name__)
            raise OpenFDAError("openFDA returned an unexpected response format.") from exc

    # All three search fields returned 404 — drug not found.
    return _not_found(clean_name)


# ---------------------------------------------------------------------------
# Custom exceptions (never include API key or token in message)
# ---------------------------------------------------------------------------

class OpenFDAError(Exception):
    """Raised when openFDA returns an unexpected HTTP error or malformed data."""


class OpenFDAUnavailableError(Exception):
    """Raised when openFDA is unreachable or times out."""
