# MediGuard — Smart Medicine Safety & Drug Interaction Assistant

> *"Because no patient should get hurt by the medicine that was supposed to help them."*

---

## 📌 Project Summary

- **Project Title**: **MediGuard** — Smart Medicine Safety & Drug Interaction Assistant
- **Team Name**: **RICR** — HackInMotion 2026 · Team ID: `HIM-1084`
- **Selected Theme**: **Healthcare & Patient Safety** — Drug Interaction Detection & Medication Management

---

## ❓ Problem Statement

Every day, millions of people take more than one medicine simultaneously — for fever, diabetes, blood pressure, allergies, or other chronic conditions. Most patients do not know that some medicines, when taken together, can react dangerously. This is called a **drug-drug interaction (DDI)**, and it can cause serious adverse side effects, reduce medicine efficacy, or lead to emergency hospitalizations.

Common risks that go unchecked:
- Patients prescribed by different doctors without cross-referencing prescriptions.
- Over-the-counter medicines bought without checking compatibility with existing prescriptions.
- Complex dosage schedules missed or forgotten by patients.

---

## ✨ Solution Overview

MediGuard is a full-stack, AI-ready web application where patients, caregivers, and pharmacists can:

1. **Sign up and log in securely**: Built-in Django REST Framework **JWT Authentication** (HS256 access & refresh tokens).
2. **Build a personal medicine cabinet**: Add medicines with custom dosage info and scheduled **Reminder Times** (`08:30 AM`).
3. **Real-time Notifications Engine**: Receives dose reminders, desktop browser notifications (Web Notifications API), and real-time safety alert badges.
4. **Run a Safety Check**: Screens cabinet medicines for drug-drug interactions using the **DDInter 2.0** database (10,874 canonical interaction pairs, 1,405 drug mappings, 1,400+ RxNorm-normalized medicines).
5. **View plain-language warnings**: Risk severity (🔴 Major / 🟠 Moderate / 🟢 Minor), clinical explanations, and actionable next steps.
6. **Personalized Medical Condition Warnings**: Overlays medical conditions (Asthma, Renal Impairment, Hypertension) over raw drug interactions.

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| Vite | 8.2 | Build tool & dev server |
| Notification API | Native | Desktop browser notification popups |
| oxlint | 1.75 | Linter |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Django | 6.1 | Web framework & ORM |
| Django REST Framework | 3.18 | REST API layer |
| PyJWT + cryptography | 2.13 / 50.0 | HS256 JWT signature & verification |
| psycopg (binary) | 3.3 | PostgreSQL database driver |
| WhiteNoise | 6.9 | Compressed production static file serving |
| django-cors-headers | 4.9 | Cross-origin resource sharing |

### Data Sources
| Source | Role |
|---|---|
| **DDInter 2.0** | Primary drug-drug interaction database (10,874 pairs) |
| **RxNorm (NLM)** | Medicine normalization & canonical identification (1,400+ medicines) |
| **openFDA Drug Label API** | Supporting FDA-approved drug label evidence (warnings, precautions, interactions, adverse reactions) |

---

## 📡 API Endpoints Summary

All endpoints support both trailing and non-trailing slash routes:

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register/` | User registration & JWT token generation | ❌ Public |
| `POST` | `/api/auth/login/` | User login & JWT token generation | ❌ Public |
| `POST` | `/api/auth/refresh/` | Obtain fresh access token using refresh token | ❌ Public |
| `GET` | `/api/auth/me/` | Fetch authenticated user details | ✅ Bearer JWT |
| `GET` | `/api/medicines/` | Search canonical medicines by name/RxCUI | ❌ Public |
| `GET` | `/api/profile/` | Retrieve patient health profile & cabinet | ✅ Bearer JWT |
| `POST` | `/api/profile/` | Create/update patient health profile | ✅ Bearer JWT |
| `GET` | `/api/dashboard/overview/` | Dashboard safety metrics & active warnings | ✅ Bearer JWT |
| `POST` | `/api/patients/safety-check/` | Personalized safety check (DDI + conditions) | ✅ Bearer JWT |

Full backend documentation: [`backend/README.md`](backend/README.md)

---

## 💻 Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Clone Repository
```bash
git clone https://github.com/Anshikakhandelwall/HackInMotion-RICR-HIM-1084.git
cd HackInMotion-RICR-HIM-1084
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate    # Linux/macOS
# venv\Scripts\activate     # Windows

pip install -r requirements.txt
export DJANGO_SECRET_KEY="local-dev-secret-key"
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

> The Vite dev server proxies all `/api/*` requests to `http://127.0.0.1:8001` automatically.

---

## Environment Variables

### `backend/.env`

```env
# Database (leave empty to use SQLite for local development)
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=5432

# Supabase — backend JWT verification
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_KEY=<your-anon-key>

# openFDA — supporting drug label evidence (never expose this key to the frontend)
OPENFDA_API_KEY=<your-openfda-api-key>
```

> `SUPABASE_JWT_ISSUER` and `SUPABASE_JWKS_URL` are derived automatically from `SUPABASE_URL`. Override only if needed.
> `OPENFDA_API_KEY` is optional for local development — if absent, the `/api/interactions/check/` endpoint still returns DDInter results with `supporting_evidence: []`.

### `frontend/.env.local`

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

> **Never** put the Supabase service-role key in the frontend. The anon/publishable key is safe.

A full template is available in [`.env.example`](.env.example).

---

## API Documentation

Full API reference: [`docs/api-documentation.md`](docs/api-documentation.md)

### Endpoint Summary

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/medicines/` | Search medicines by name / RxCUI | No |
| `GET` | `/api/medicines/{id}/` | Medicine detail by ID | No |
| `GET` | `/api/medicines/rxcui/{rxcui}/` | Medicine detail by RxCUI | No |
| `GET` | `/api/profile/` | Get authenticated user profile | ✅ Yes |
| `POST` | `/api/profile/` | Create / upsert user health profile | ✅ Yes |
| `PATCH` | `/api/profile/` | Partial update user health profile | ✅ Yes |
| `POST` | `/api/interactions/check/` | Unified interaction check (DDInter + openFDA) | ✅ Yes |
| `GET` | `/api/interactions/openfda/` | Standalone openFDA drug label lookup | ✅ Yes |
| `POST` | `/api/interactions/explain/` | AI clinical explanation for a drug pair | ✅ Yes |
| `GET` | `/api/dashboard/overview/` | Dashboard safety metrics | Optional |
| `POST` | `/api/patients/safety-check/` | Personalized safety check (DDI + conditions) | Optional |
| `GET` | `/api/auth/supabase/me/` | Verify Supabase JWT, return Django user | ✅ Yes |

### Authentication

All protected endpoints use **Supabase JWT authentication**:

```
Authorization: Bearer <supabase_access_token>
```

Django verifies the ES256 token using the Supabase JWKS endpoint — no secrets are stored in the backend. On success, `request.user` is set to the Django user whose `username` equals the Supabase `sub` claim (UUID).

---

## Database Details

Full schema reference: [`docs/database.md`](docs/database.md)

### Core Tables

| Table | Purpose |
|---|---|
| `auth_user` | Django user — identity mapped from Supabase JWT `sub` |
| `authentication_userprofile` | User health profile (age, conditions, medicines, onboarding status) |
| `medicines` | 1,400+ RxNorm-normalized canonical medicines |
| `ddinter_drug_mappings` | 1,405 DDInter → RxNorm medicine mappings |
| `drug_interactions` | 10,874 canonical drug-drug interaction pairs (Major / Moderate / Minor) |

### Database Configuration

- **Local development**: SQLite (automatic, no setup needed — `DB_HOST` not set)
- **Production**: PostgreSQL via Supabase (set `DB_*` variables in `backend/.env`)

---

## 🚢 Deployment Configuration

## Key Design Decisions

### 1. Offline-first DDI database
Rather than calling an external API at query time (latency, rate limits, downtime risk), the entire DDInter 2.0 dataset is pre-processed and loaded into the local database. Interaction checks are pure SQL — fast, reliable, and offline-capable.

### 2. Supabase Auth with Django as security boundary
The frontend uses Supabase Auth directly (no custom auth server). Django verifies the Supabase ES256 JWT on every request via JWKS — the backend never trusts anything from the frontend except the signed token. User identity (`request.user`) is derived from the JWT `sub` claim only.

### 3. RxNorm normalization layer
User inputs (medicine names, brand names, partial matches) are resolved through a four-step pipeline: exact RxCUI → database PK → case-insensitive name → DDInter mapping. This means "paracetamol", "Paracetamol", "PARACETAMOL", and the DDInter alias all resolve to the same canonical medicine record.

### 4. openFDA as supporting evidence — not the primary source
openFDA is integrated as a best-effort enrichment step in the unified interaction pipeline. After DDInter determines interaction severity, the backend queries the openFDA Drug Label API to fetch FDA-approved label information (warnings, precautions, drug interactions text, adverse reactions) for each resolved medicine. If openFDA is unavailable or times out, the DDInter interaction result is still returned — the failure is surfaced in the response as `"available": false` per affected medicine, without crashing the request. The openFDA API key is stored exclusively in backend environment variables and is never included in any response, log, or exception.

```
User input
      ↓
Input cleanup (strip, deduplicate)
      ↓
RxNorm resolution (RxCUI → DB PK → name → DDInter alias)
      ↓
DDInter pairwise interaction check (primary source)
      ↓
openFDA drug label lookup per resolved medicine (supporting evidence)
      ↓
Combined normalized response
```

### 5. Personalized safety engine
Beyond raw DDI pairs, the `PatientSafetyEngine` overlays condition-specific contraindication rules (Asthma + NSAIDs, Renal impairment + Metformin/NSAIDs, Hypertension + decongestants) to generate warnings tailored to the user's health profile.

---

## Screenshots

> <img width="1020" height="680" alt="image" src="https://github.com/user-attachments/assets/b4b2a3f1-ff60-48ea-9ce8-e1a6d53e2f58" />



| Screen | Description |
|---|---|
| Login / Signup | Supabase-backed email/password authentication |
| Health Profile Onboarding | Age, medical conditions, regular medicines |
| Dashboard | Safety overview card, active medicine count, recent checks |
| Medicines Page | Medication cabinet — search, add, remove medicines |
| Safety Check | Run interaction check, view severity summary and result cards |
| Interaction Details | Full detail view for a specific drug pair interaction |
| History | Past safety checks and interaction results |
| Profile | View and edit health profile |

---

## Deployment Link

> _Deployment in progress. Link to be added._

---

## Future Scope

| Feature | Description |
|---|---|
| **Prescription OCR** | Upload a photo of a prescription — auto-extract medicine names using OCR |
| **Medicine Reminders** | Push notification reminders for scheduled doses |
| **Multi-language Support** | Results in Hindi and other regional languages for broader accessibility |
| **Doctor / Pharmacist Mode** | Separate view with full clinical data and interaction mechanism detail |
| **AI Symptom Explainer** | Use an LLM to generate plain-language explanations for complex interactions |
| **Allergy Cross-Check** | Warn when a searched medicine conflicts with user-marked known allergies |
| **DailyMed Integration** | Add DailyMed as an additional label evidence source alongside openFDA |
| **Interaction History Persistence** | Store each safety check in the database for full longitudinal history |

---

## 📑 Disclaimer

> MediGuard is an informational tool built for educational and hackathon purposes. It is **not a substitute for professional medical advice, diagnosis, or treatment**. Always consult a qualified healthcare provider before making any medication decisions.

---

*Built with ❤️ for HackInMotion 2026 — Team RICR (HIM-1084)*
