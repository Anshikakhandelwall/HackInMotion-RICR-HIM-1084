# MediGuard API Documentation

This document tracks all active backend REST API endpoints built with Django REST Framework (DRF), detailing how each API was initialized, what it does, how it receives requests, and the specific service it provides to the MediGuard application.

---

## 1. Medicine APIs (`apps.medicines`)

### 1.1 List & Search Medicines API

- **Endpoint**: `GET /api/medicines/`
- **Name**: `medicines:medicine-list`

#### Initialization
- **Serializer**: `MedicineSerializer` ([apps/medicines/serializers.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/medicines/serializers.py))
- **View**: `MedicineListView` ([apps/medicines/views.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/medicines/views.py)) extending DRF `APIView`.
- **Route**: `path("", MedicineListView.as_view(), name="medicine-list")` in [apps/medicines/urls.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/medicines/urls.py), included under `/api/medicines/` in [config/urls.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/config/urls.py).

#### What It Does
Provides read-only lookup and real-time auto-complete search across the canonical 1,400 RxNorm medicines database and 1,405 DDInter drug name mappings.

#### Request Specification
- **HTTP Method**: `GET`
- **URL Query Parameters**:
  - `search` *(optional string)*: Search keyword to match against medicine names, RxCUIs, or DDInter mapped drug names.
- **Example Request**:
  ```http
  GET /api/medicines/?search=para HTTP/1.1
  Host: 127.0.0.1:8000
  Accept: application/json
  ```

#### Provided Service
- Executes database-side `Q` filtering across `rxnorm_name`, `rxcui`, and related `ddinter_mappings__ddinter_drug_name` with `.distinct()`.
- Caps response size to top 50 matches for high performance.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 1,
    "results": [
      {
        "id": 1,
        "rxcui": "161",
        "name": "acetaminophen",
        "rxnorm_name": "acetaminophen",
        "tty": "IN"
      }
    ]
  }
  ```

---

### 1.2 Medicine Detail by Primary Key API

- **Endpoint**: `GET /api/medicines/{id}/`
- **Name**: `medicines:medicine-detail`

#### Initialization
- **Serializer**: `MedicineSerializer` ([apps/medicines/serializers.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/medicines/serializers.py))
- **View**: `MedicineDetailView` ([apps/medicines/views.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/medicines/views.py)) extending DRF `APIView`.
- **Route**: `path("<int:pk>/", MedicineDetailView.as_view(), name="medicine-detail")` in [apps/medicines/urls.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/medicines/urls.py).

#### What It Does
Retrieves full canonical details of a single medicine using its database primary key (`id`).

#### Request Specification
- **HTTP Method**: `GET`
- **URL Parameters**:
  - `id` *(integer, required)*: Database primary key of the medicine.
- **Example Request**:
  ```http
  GET /api/medicines/1/ HTTP/1.1
  Host: 127.0.0.1:8000
  Accept: application/json
  ```

#### Provided Service
- Queries `Medicine.objects.get(pk=pk)`. Returns 404 error response if the ID does not exist.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "medicine": {
      "id": 1,
      "rxcui": "161",
      "name": "acetaminophen",
      "rxnorm_name": "acetaminophen",
      "tty": "IN"
    }
  }
  ```
- **Error Response (404 Not Found)**:
  ```json
  {
    "success": false,
    "message": "Medicine with ID '99999' not found."
  }
  ```

---

### 1.3 Medicine Detail by RxCUI API

- **Endpoint**: `GET /api/medicines/rxcui/{rxcui}/`
- **Name**: `medicines:medicine-rxcui-detail`

#### Initialization
- **Serializer**: `MedicineSerializer` ([apps/medicines/serializers.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/medicines/serializers.py))
- **View**: `MedicineRxCUIDetailView` ([apps/medicines/views.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/medicines/views.py)) extending DRF `APIView`.
- **Route**: `path("rxcui/<str:rxcui>/", MedicineRxCUIDetailView.as_view(), name="medicine-rxcui-detail")` in [apps/medicines/urls.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/medicines/urls.py).

#### What It Does
Retrieves canonical medicine information using its standardized RxNorm Concept Unique Identifier (`rxcui`).

#### Request Specification
- **HTTP Method**: `GET`
- **URL Parameters**:
  - `rxcui` *(string, required)*: Canonical RxCUI identifier (e.g. `"161"`, `"11289"`).
- **Example Request**:
  ```http
  GET /api/medicines/rxcui/161/ HTTP/1.1
  Host: 127.0.0.1:8000
  Accept: application/json
  ```

#### Provided Service
- Performs exact indexed lookup `Medicine.objects.get(rxcui=clean_rxcui)`.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "medicine": {
      "id": 1,
      "rxcui": "161",
      "name": "acetaminophen",
      "rxnorm_name": "acetaminophen",
      "tty": "IN"
    }
  }
  ```
- **Error Response (404 Not Found)**:
  ```json
  {
    "success": false,
    "message": "Medicine with RxCUI '99999999' not found."
  }
  ```

---

## 2. Authentication & Profile APIs (`apps.authentication`)

### 2.1 User Registration API
- **Endpoint**: `POST /api/auth/register/`
- **Service**: Creates user account and associated `UserProfile` record.
- **Request**: `{ "fullName": "Jane Doe", "email": "jane@example.com", "password": "Password123" }`
- **Response**: `{ "success": true, "user": { "id": 1, "email": "jane@example.com" } }`

### 2.2 User Login API
- **Endpoint**: `POST /api/auth/login/`
- **Service**: Authenticates user credentials, generates auth token, and returns user profile & `profile_completed` status.
- **Request**: `{ "email": "jane@example.com", "password": "Password123" }`
- **Response**: `{ "success": true, "token": "...", "user": { ... } }`

### 2.3 Onboarding Health Profile API
- **Endpoint**: `POST /api/auth/profile/onboarding/`
- **Service**: Updates user's age, medical conditions, and regular medicines, setting `profile_completed = True`.
- **Request**: `{ "age": 30, "medicalConditions": "None", "regularMedicines": ["Paracetamol"] }`
- **Response**: `{ "success": true, "user": { ... } }`

---

### 2.4 Patient Health Profile API (`GET`, `POST`, `PATCH /api/profile/`)

- **Endpoints**:
  - `GET /api/profile/` — Retrieve authenticated user profile
  - `POST /api/profile/` — Create or update user profile (idempotent upsert)
  - `PATCH /api/profile/` — Partial update of user profile
- **Name**: `patient-profile`

#### Authentication & Authorization
- **Authentication**: `SupabaseAuthentication` (validates `Authorization: Bearer <token>` via RS256 / JWKS)
- **Permissions**: `IsAuthenticated`
- **User Scoping**: Profile ownership is determined strictly via `request.user` (`username` = Supabase JWT `sub`). No user IDs are accepted from request bodies or parameters to prevent IDOR vulnerabilities.

#### Request Payload Specification (POST / PATCH)
```json
{
  "age": 30,
  "medicalConditions": "Asthma, Hypertension",
  "regularMedicines": ["acetaminophen", "warfarin"]
}
```

#### Provided Service
- **GET**: Returns `{ "profile_exists": true, "profile": { "age": 30, "medicalConditions": "...", "regularMedicines": [...], "profileCompleted": true } }`. Returns 404 with `"profile_exists": false` if uninitialized.
- **POST/PATCH**: Creates or updates `UserProfile` for the authenticated user and automatically updates `profileCompleted` status.


---

## 3. Drug Interaction APIs (`apps.interactions`)

### 3.1 Unified Drug Interaction Check API (DDInter + openFDA)

- **Endpoint**: `POST /api/interactions/check/`
- **Name**: `interactions:interaction-check`

#### Initialization
- **Serializer**: `InteractionCheckRequestSerializer` (`apps/interactions/serializers.py`)
- **Service Engine**: `InteractionEngine` (`apps/interactions/services.py`)
- **openFDA helper**: `_fetch_openfda_evidence()` (`apps/interactions/views.py`)
- **View**: `InteractionCheckView` (`apps/interactions/views.py`) extending DRF `APIView`.
- **Route**: `path("check/", ...)` in `apps/interactions/urls.py`, included under `/api/interactions/`.

#### Authentication
- **Authentication**: `SupabaseAuthentication` (Supabase JWT RS256 via JWKS)
- **Permissions**: `IsAuthenticated` — unauthenticated requests receive `401 Unauthorized`.

#### What It Does
Unified interaction pipeline:

```
medicines input
      ↓
Validation (serializer)
      ↓
RxNorm resolution  (RxCUI → DB PK → name → DDInter alias)
      ↓
DDInter pairwise interaction check  (primary source — offline DB)
      ↓
openFDA drug label lookup per medicine  (best-effort supporting evidence)
      ↓
Combined normalized response
```

1. **RxNorm resolution** (`InteractionEngine.resolve_medicines`): resolves each input to a canonical `Medicine` record via four fallback strategies (RxCUI → PK → case-insensitive name → DDInter alias).
2. **DDInter pairwise check**: generates N(N-1)/2 unique pairs and executes a single optimized ORM query with combined `Q` filters.
3. **openFDA enrichment** (`_fetch_openfda_evidence`): for each resolved medicine, queries the openFDA Drug Label API for warnings, precautions, drug interactions text, and adverse reactions. If openFDA is unavailable or times out, the DDInter result is still returned — the failure appears as `"available": false` in `supporting_evidence`. The API key is **never** included in any response.

#### Request Specification
- **HTTP Method**: `POST`
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <supabase_token>`
- **Request Body**:
  ```json
  {
    "medicines": ["warfarin", "aspirin"]
  }
  ```
  Accepts medicine names, RxCUIs, or database IDs.

#### Success Response (200 OK)
```json
{
  "success": true,
  "has_interactions": true,
  "summary": {
    "total_checked": 2,
    "pairs_checked": 1,
    "interactions_found": 1,
    "major": 1,
    "moderate": 0,
    "minor": 0
  },
  "checked_medicines": [
    { "id": 1, "rxcui": "11289", "name": "warfarin", "rxnorm_name": "warfarin", "tty": "IN" },
    { "id": 2, "rxcui": "1191",  "name": "aspirin",  "rxnorm_name": "aspirin",  "tty": "IN" }
  ],
  "interactions": [
    {
      "id": 42,
      "medicine_a": { "id": 1, "rxcui": "11289", "name": "warfarin", "rxnorm_name": "warfarin" },
      "medicine_b": { "id": 2, "rxcui": "1191",  "name": "aspirin",  "rxnorm_name": "aspirin"  },
      "severity": "Major",
      "level": "Major",
      "description": "Potential major interaction identified between warfarin and aspirin."
    }
  ],
  "supporting_evidence": [
    {
      "drug": "warfarin",
      "source": "openFDA",
      "available": true,
      "generic_name": "warfarin",
      "brand_name": "Coumadin",
      "rxcui": "11289",
      "drug_interactions": ["Aspirin may increase bleeding risk when used with warfarin."],
      "warnings": ["Monitor INR closely."],
      "precautions": ["Avoid concurrent NSAID use."],
      "adverse_reactions": ["Bleeding, haemorrhage."]
    },
    {
      "drug": "aspirin",
      "source": "openFDA",
      "available": false,
      "reason": "No drug label found in openFDA."
    }
  ]
}
```

#### Error Responses
| Status | Condition |
|--------|-----------|
| `400 Bad Request` | `medicines` field missing or empty |
| `401 Unauthorized` | Missing or invalid Supabase JWT |

---

### 3.2 openFDA Drug Label Lookup API

- **Endpoint**: `GET /api/interactions/openfda/?drug=<name>`
- **Name**: `interactions:openfda-label`

#### Authentication
- **Authentication**: `SupabaseAuthentication`
- **Permissions**: `IsAuthenticated`

#### What It Does
Fetches and returns normalized drug label information from the openFDA Drug Label API for a single medicine. This is a standalone supporting evidence endpoint — it does **not** replace the DDInter interaction pipeline.

The `OPENFDA_API_KEY` is stored exclusively in the backend environment and is never included in any response.

#### Request Specification
- **HTTP Method**: `GET`
- **Query Parameters**: `drug` *(string, required)* — medicine name to look up.
- **Example**: `GET /api/interactions/openfda/?drug=warfarin`

#### Success Response (200 OK)
```json
{
  "success": true,
  "source": "openFDA",
  "drug": {
    "name": "warfarin",
    "generic_name": "warfarin",
    "brand_name": "Coumadin",
    "rxcui": "11289"
  },
  "safety_information": {
    "drug_interactions": ["Aspirin increases bleeding risk."],
    "warnings": ["Monitor INR closely."],
    "precautions": ["Avoid NSAIDs."],
    "adverse_reactions": ["Bleeding."]
  }
}
```

#### Error Responses
| Status | Condition |
|--------|-----------|
| `400 Bad Request` | `drug` query parameter missing |
| `401 Unauthorized` | Missing or invalid Supabase JWT |
| `404 Not Found` | Drug not found in openFDA |
| `503 Service Unavailable` | API key not configured or openFDA unreachable/timeout |
| `502 Bad Gateway` | openFDA returned an unexpected HTTP error |

---

### 3.3 AI Interaction Explanation API

- **Endpoint**: `POST /api/interactions/explain/`
- **Name**: `interactions:interaction-explain`

#### What It Does
Accepts a drug pair (and optional severity), invokes the AI layer, and returns structured plain-language clinical guidance: what the interaction means, what to watch for, and what to do.

#### Request Specification
```json
{ "drug_a": "warfarin", "drug_b": "aspirin", "severity": "Major" }
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "drug_a": "warfarin",
  "drug_b": "aspirin",
  "severity": "Major",
  "ai_explanation": {
    "what_does_this_mean": "...",
    "what_to_watch_for": "...",
    "what_should_you_do": "...",
    "disclaimer": "..."
  }
}
```

---

## 4. Dashboard Overview & Patient Safety APIs (`apps.patients`)

### 4.1 Dashboard Overview API

- **Endpoint**: `GET /api/dashboard/overview/`
- **Name**: `patients:dashboard-overview`

#### Initialization
- **Service Engine**: `PatientSafetyEngine` ([apps/patients/services.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/patients/services.py))
- **View**: `DashboardOverviewView` ([apps/patients/views.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/patients/views.py)) extending DRF `APIView`.
- **Route**: `path("dashboard/overview/", DashboardOverviewView.as_view(), name="dashboard-overview")` in [apps/patients/urls.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/patients/urls.py), registered in [config/urls.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/config/urls.py).

#### What It Does
Provides dynamic overview card metrics for the user dashboard: count of active cabinet medicines, overall safety alert status, and breakdown of detected major and moderate warnings.

#### Request Specification
- **HTTP Method**: `GET`
- **Example Request**:
  ```http
  GET /api/dashboard/overview/ HTTP/1.1
  Host: 127.0.0.1:8000
  Accept: application/json
  ```

#### Provided Service
- Evaluates the user's active prescriptions and health conditions to return a live safety card overview.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "safety_overview": {
      "title": "Safety Overview",
      "mainValue": "1 Active Warning",
      "supportingText": "Potential medication interactions need your attention.",
      "lastChecked": "Today",
      "hasWarnings": true,
      "majorCount": 0,
      "moderateCount": 1
    },
    "active_medicines_count": 2,
    "regular_medicines": ["acetaminophen", "warfarin"],
    "medical_conditions": "Asthma"
  }
  ```

---

### 4.2 Personalized Patient Safety Check API

- **Endpoint**: `POST /api/patients/safety-check/`
- **Name**: `patients:patient-safety-check`

#### Initialization
- **Service Engine**: `PatientSafetyEngine` ([apps/patients/services.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/patients/services.py))
- **View**: `PersonalizedSafetyCheckView` ([apps/patients/views.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/patients/views.py)) extending DRF `APIView`.
- **Route**: `path("safety-check/", PersonalizedSafetyCheckView.as_view(), name="patient-safety-check")` in [apps/patients/urls.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/patients/urls.py).

#### What It Does
Combines canonical drug-drug interactions (`DrugInteraction` database) with patient-specific medical conditions (e.g., Asthma, Renal impairment, Hypertension) to generate personalized safety warnings.

#### Request Specification
- **HTTP Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body Payload**:
  ```json
  {
    "medicines": ["acetaminophen", "warfarin", "aspirin"],
    "medicalConditions": "Asthma"
  }
  ```

#### Provided Service
- **Canonical Drug Interactions**: Runs $N(N-1)/2$ pairwise interaction checks.
- **Patient Condition Warnings**: Evaluates condition contraindications (e.g. Asthma + NSAIDs like Aspirin/Ibuprofen; Renal impairment + NSAIDs/Metformin; Hypertension + Decongestants).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "has_warnings": true,
    "drug_interactions": { ... },
    "patient_condition_warnings": [
      {
        "type": "condition_warning",
        "severity": "Moderate",
        "title": "Asthma & NSAID Caution",
        "description": "Patient has asthma. Aspirin should be used with caution as NSAIDs can trigger bronchospasm in susceptible individuals."
      }
    ],
    "summary": {
      "total_medicines_checked": 3,
      "drug_interactions_count": 1,
      "condition_warnings_count": 1,
      "major_warnings": 0,
      "moderate_warnings": 2
    }
  }
  ```


