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

### 3.1 Pairwise Drug Interaction Check API

- **Endpoint**: `POST /api/interactions/check/`
- **Name**: `interactions:interaction-check`

#### Initialization
- **Serializer**: `InteractionCheckRequestSerializer` ([apps/interactions/serializers.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/interactions/serializers.py))
- **Service Engine**: `InteractionEngine` ([apps/interactions/services.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/interactions/services.py))
- **View**: `InteractionCheckView` ([apps/interactions/views.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/interactions/views.py)) extending DRF `APIView`.
- **Route**: `path("check/", InteractionCheckView.as_view(), name="interaction-check")` in [apps/interactions/urls.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/apps/interactions/urls.py), included under `/api/interactions/` in [config/urls.py](file:///home/lenovo/Documents/HackInMotion-RICR-HIM-1084/backend/config/urls.py).

#### What It Does
Screens a list of medicines against the 10,874 canonical drug interaction pairs database (`DrugInteraction`). It resolves raw medicine names, RxCUIs, or IDs to canonical Medicine records, generates all unique pairwise combinations $N(N-1)/2$, and evaluates interaction severity (`Major`, `Moderate`, `Minor`).

#### Request Specification
- **HTTP Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body Payload**:
  ```json
  {
    "medicines": ["161", "11289"]
  }
  ```

#### Provided Service
- **Validation**: Ensures the `medicines` array is provided and not empty. Returns HTTP 400 Bad Request on invalid payloads.
- **Canonical Resolution**: Maps RxCUIs, database primary keys, RxNorm names, and DDInter drug mappings to canonical `Medicine` objects.
- **Pairwise Combination Logic**: Generates unique pairs and canonicalizes ordering `(medicine_a_id < medicine_b_id)`.
- **Performance Optimization**: Executes a single optimized Django ORM query with combined `Q` filters and `select_related("medicine_a", "medicine_b")` to prevent N+1 queries.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "has_interactions": true,
    "summary": {
      "total_checked": 2,
      "pairs_checked": 1,
      "interactions_found": 1,
      "major": 0,
      "moderate": 1,
      "minor": 0
    },
    "checked_medicines": [
      {
        "id": 1,
        "rxcui": "161",
        "name": "acetaminophen",
        "rxnorm_name": "acetaminophen",
        "tty": "IN"
      },
      {
        "id": 2,
        "rxcui": "11289",
        "name": "warfarin",
        "rxnorm_name": "warfarin",
        "tty": "IN"
      }
    ],
    "interactions": [
      {
        "id": 10,
        "medicine_a": {
          "id": 1,
        "severity": "Moderate",
        "level": "Moderate",
        "description": "Potential moderate interaction identified between acetaminophen and warfarin."
      }
    ]
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


