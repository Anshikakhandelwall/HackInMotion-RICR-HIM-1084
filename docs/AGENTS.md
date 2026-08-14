# Backend Integration Instructions

## Project Goal

The frontend and database layers are already implemented.

The remaining task is to build the Django backend API layer that connects the existing frontend to the existing Supabase PostgreSQL database.

Architecture:

Frontend
↓
Django REST API
↓
Django ORM
↓
Supabase PostgreSQL

Do NOT redesign the frontend.

Do NOT recreate or redesign the existing database.

Do NOT replace Supabase PostgreSQL.

Do NOT modify existing production data unless explicitly required.

The backend should expose clean, predictable REST APIs that allow the existing frontend to interact with the existing database.

---

# Current Database State

The database layer is already complete and verified.

## Medicine

There are currently:

- 1,400 canonical RxNorm medicines

Each Medicine contains:

- id
- rxcui
- rxnorm_name
- tty
- created_at
- updated_at

## DDInterDrugMapping

There are currently:

- 1,405 DDInter → Medicine mappings

This maps DDInter drug names to canonical RxNorm Medicine records.

`Tolevamer` is intentionally unmatched and does not have a Medicine record.

## DrugInteraction

There are currently:

- 10,874 canonical medicine-pair interactions

Severity levels:

- Major
- Moderate
- Minor

Existing database constraints enforce:

- Unique medicine pairs
- No self-interactions
- Foreign-key integrity

Do not recreate these models or migrations.

---

# Backend Development Strategy

Build the backend incrementally.

The order should be:

1. Dashboard API foundation
2. Medicine search API
3. Medicine selection/details API
4. Drug interaction checking API
5. Multi-medicine interaction checking
6. Patient profile API
7. Patient-specific safety checks
8. Caregiver functionality
9. Pharmacist functionality
10. Frontend integration
11. API testing
12. End-to-end testing

Do not implement all features in one large change.

---

# Phase 1 — Dashboard Backend Foundation

The dashboard is the starting point of the application.

Before implementing complex functionality:

1. Inspect the existing frontend dashboard.
2. Identify what information the dashboard currently expects.
3. Identify which dashboard components require backend data.
4. Identify which values are currently hardcoded/mock data.
5. Replace mock data with API-driven data where appropriate.

The dashboard should eventually be able to display information such as:

- User's medicines
- Number of active medicines
- Recent interaction checks
- Detected interaction warnings
- Severity summary
- Patient safety alerts
- Relevant profile information

Do not invent dashboard requirements that are not present in the existing frontend.

First inspect the frontend and determine the actual required API contract.

---

# Phase 2 — Medicine API

Create a read-only Medicine API.

The frontend must be able to:

- Search medicines by name.
- Retrieve a medicine by database ID.
- Retrieve a medicine by RxCUI.
- Return canonical medicine information.

Suggested endpoints:

GET `/api/medicines/`

GET `/api/medicines/{id}/`

GET `/api/medicines/rxcui/{rxcui}/`

Search example:

GET `/api/medicines/?search=para`

Example response:

```json
{
    "id": 123,
    "rxcui": "161",
    "name": "acetaminophen",
    "tty": "IN"
}
```

Use Django REST Framework serializers for API representations. `ModelSerializer` is appropriate when the API representation maps closely to an existing Django model. citeturn0search2

Use efficient querysets and avoid loading all 1,400 medicines into memory unnecessarily.

The Medicine API should be read-only for normal application usage.

---

# Phase 3 — Medicine Search and Selection

Connect the medicine-selection flow from the frontend to the Medicine API.

Expected flow:

User opens medicine search
↓
Frontend sends search request
↓
Django searches Medicine table
↓
Matching medicines returned
↓
User selects medicine
↓
Frontend stores canonical Medicine/RxCUI identifier

Important:

The frontend must use the canonical Medicine/RxCUI identity after selection.

Do not use the raw DDInter name as the application's primary medicine identifier.

---

# Phase 4 — Drug Interaction API

Create the main interaction-checking endpoint.

Suggested endpoint:

POST `/api/interactions/check/`

Example request:

```json
{
    "medicines": ["161", "11289"]
}
```

The backend must:

1. Validate the request.
2. Resolve the supplied medicines to canonical Medicine records.
3. Remove duplicate medicine selections if appropriate.
4. Generate every unique medicine pair.
5. Canonicalize the pair.
6. Query DrugInteraction.
7. Return all matching interactions.
8. Return severity.
9. Return the affected medicine information.
10. Clearly indicate whether interactions were found.

For N medicines:

N(N-1)/2

unique medicine pairs must be checked.

Example:

5 medicines → 10 unique pairs.

Do not perform unnecessary individual database queries for every pair if the same operation can be efficiently handled with Django ORM queries.

---

# Phase 5 — Interaction Response

Return a frontend-friendly response.

Example:

```json
{
    "has_interactions": true,
    "checked_medicines": [
        {
            "rxcui": "161",
            "name": "acetaminophen"
        },
        {
            "rxcui": "11289",
            "name": "warfarin"
        }
    ],
    "interactions": [
        {
            "medicine_a": {
                "rxcui": "161",
                "name": "acetaminophen"
            },
            "medicine_b": {
                "rxcui": "11289",
                "name": "warfarin"
            },
            "severity": "Moderate"
        }
    ]
}
```

The exact response structure should be adjusted to match the existing frontend API requirements.

Keep the response contract consistent once established.

---

# Phase 6 — Dashboard Interaction Results

Connect the interaction API to the dashboard.

The dashboard should be able to display:

- Number of medicines checked
- Whether interactions were found
- Number of Major interactions
- Number of Moderate interactions
- Number of Minor interactions
- List of affected medicine pairs
- Severity of each interaction
- Clear no-interaction state

Example flow:

Dashboard
↓
User selects medicines
↓
POST /api/interactions/check/
↓
Django interaction service
↓
DrugInteraction database
↓
Interaction results
↓
Dashboard warning/result UI

The frontend should not contain hardcoded interaction logic.

The backend/database should remain the source of truth.

---

# Phase 7 — Patient Profile API

After the basic interaction system works, connect the patient profile.

The profile may contain:

- Medical conditions
- Allergies
- Existing medications
- Relevant patient information

The backend should provide APIs for retrieving and updating the profile where required by the existing frontend.

Do not mix patient-specific information directly into the canonical Medicine or DrugInteraction tables.

Keep patient information separate.

---

# Phase 8 — Patient-Specific Safety Checks

The application should eventually combine:

Canonical drug interactions
+
Patient conditions
+
Patient allergies
+
Current medications
=
Personalized safety warnings

For example:

A medicine may have no direct interaction with another medicine but may still require a warning based on the patient's known condition or allergy.

Keep this logic separate from the basic DrugInteraction model.

Recommended conceptual structure:

```text
Medicine
   ↓
DrugInteraction Engine
   ↓
Basic interaction result
   ↓
Patient Safety Engine
   ├── Conditions
   ├── Allergies
   └── Existing medications
   ↓
Personalized safety result
```

Do not modify the canonical interaction database to store patient-specific warnings.

---

# Phase 9 — Caregiver Flow

The existing frontend supports caregiver-related functionality.

Inspect the frontend first and identify the exact caregiver workflow.

The backend should eventually support:

- Viewing the relevant patient's profile
- Viewing the patient's medicines
- Running interaction checks for that patient
- Viewing patient-specific safety warnings

Do not duplicate patient records unnecessarily.

Use relationships between the caregiver and patient where required by the existing application design.

---

# Phase 10 — Pharmacist Flow

Inspect the existing pharmacist frontend and determine its required backend functionality.

Potential functionality includes:

- Medicine search
- Medicine information
- Interaction checking
- Viewing interaction severity
- Reviewing safety information

Keep pharmacist functionality separate from patient-specific data unless the existing application explicitly requires it.

---

# Phase 11 — API Structure

Keep API code organized.

Prefer a structure similar to:

```text
apps/
    medicines/
        models.py
        serializers.py
        views.py
        urls.py

    interactions/
        models.py
        serializers.py
        views.py
        urls.py
        services.py

    patients/
        models.py
        serializers.py
        views.py
        urls.py
```

Use DRF generic views for straightforward read/list/detail operations where appropriate. DRF's generic views are designed for common model-backed API patterns. citeturn0search0

Use `APIView` or a custom service layer when the operation contains complex business logic, such as multi-medicine interaction checking. citeturn0search3

Do not put all backend logic inside one `views.py`.

Complex interaction logic should be placed in a dedicated service/helper layer.

---

# Phase 12 — Frontend Integration

Once individual APIs work independently:

1. Inspect the existing frontend API/client implementation.
2. Connect dashboard data to backend APIs.
3. Connect medicine search to `/api/medicines/`.
4. Connect medicine selection to canonical Medicine/RxCUI identifiers.
5. Connect interaction checking to `/api/interactions/check/`.
6. Connect patient profile data.
7. Connect caregiver functionality.
8. Connect pharmacist functionality.
9. Remove obsolete mock data.
10. Verify loading, success, empty, and error states.

Do not duplicate backend business logic inside the frontend.

The frontend should primarily:

- Send requests
- Display results
- Handle loading/error states
- Manage UI state

The backend should handle:

- Validation
- Database queries
- Interaction logic
- Patient-specific safety logic
- Business rules

---

# API Validation

The backend must reject or properly handle:

- Empty medicine lists
- Invalid medicine IDs
- Unknown RxCUIs
- Duplicate medicines where inappropriate
- Self-interaction requests
- Malformed JSON
- Missing required fields
- Unsupported request methods

Use appropriate HTTP status codes.

Do not expose Python/Django tracebacks to the frontend.

---

# Database Safety

The existing database has already been imported and verified.

Do NOT:

- Delete existing Medicine records.
- Delete DDInterDrugMapping records.
- Delete DrugInteraction records.
- Re-import the datasets unnecessarily.
- Recreate the existing tables.
- Modify migration history without a genuine requirement.

Current verified counts:

```text
Medicine             1,400
DDInterDrugMapping   1,405
DrugInteraction      10,874
```

These counts should remain unchanged while building the API layer unless a deliberate database change is explicitly required.

---

# Performance Requirements

The database contains more than 10,000 interactions.

Do not implement interaction checking using inefficient Python loops over the entire DrugInteraction table.

Use Django ORM filtering and database-side queries.

Avoid N+1 queries.

Use `select_related()` / `prefetch_related()` where appropriate for related Medicine records.

DRF specifically recommends optimizing querysets when serializers span ORM relationships to avoid N+1 query problems. citeturn0search0

---

# Testing

Every backend feature must be tested.

## Medicine API

Test:

- Search by medicine name.
- Search with partial names.
- RxCUI lookup.
- Valid medicine retrieval.
- Unknown medicine.
- Empty search.
- Case-insensitive search where appropriate.

## Interaction API

Test:

- Two interacting medicines.
- Two non-interacting medicines.
- Multiple medicines.
- Duplicate medicines.
- Invalid medicines.
- Unknown RxCUIs.
- Self-interaction.
- Major interaction.
- Moderate interaction.
- Minor interaction.
- No-interaction response.

## Patient API

Test:

- Profile retrieval.
- Profile update.
- Medical conditions.
- Allergies.
- Existing medicines.
- Patient-specific safety checks.

## Database integrity

Verify:

```text
Medicine count              = 1,400
DDInterDrugMapping count    = 1,405
DrugInteraction count       = 10,874
```

Also verify:

- No duplicate interaction pairs.
- No self-interactions.
- No broken foreign keys.

Run:

```bash
python manage.py check
python manage.py test
```

---

# Development Workflow

Work incrementally.

For each feature:

1. Inspect the existing frontend requirement.
2. Inspect the existing Django models.
3. Implement the smallest backend change.
4. Run:

```bash
python manage.py check
```

5. Run relevant tests.
6. Test the endpoint manually.
7. Verify the database when necessary.
8. Test the frontend against the endpoint.
9. Review the diff.
10. Commit the completed logical unit.

Suggested commits:

```text
Add dashboard API foundation
Add medicine search API
Add medicine detail API
Add drug interaction API
Add patient profile API
Add patient safety checks
Connect dashboard to backend APIs
Connect medicine workflow to backend
Connect interaction workflow to backend
```

Do not combine unrelated features into a single commit.

---

# Definition of Done

The backend integration is complete when the existing frontend can communicate with the existing Supabase PostgreSQL database entirely through Django APIs.

The main user flow should work as:

```text
Dashboard
    ↓
Search Medicine
    ↓
Select Medicine
    ↓
Add multiple Medicines
    ↓
Check Interactions
    ↓
Django Interaction API
    ↓
DrugInteraction Database
    ↓
Interaction Results
    ↓
Dashboard
```

The patient-specific flow should then extend this to:

```text
Patient Profile
    ↓
Conditions + Allergies + Current Medicines
    ↓
Interaction Check
    ↓
Basic Drug Interactions
    +
Patient-Specific Safety Rules
    ↓
Personalized Safety Result
```

The caregiver flow should allow the caregiver to access the relevant patient's information and perform the same safety checks where supported by the frontend.

The pharmacist flow should provide the medicine and interaction functionality required by the existing pharmacist interface.

The final implementation must preserve the existing frontend design and existing canonical drug database.