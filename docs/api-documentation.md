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
