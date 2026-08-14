# MediGuard — Smart Medicine Safety & Drug Interaction Assistant

> *"Because no patient should get hurt by the medicine that was supposed to help them."*

---

## Project Title

**MediGuard** — Smart Medicine Safety & Drug Interaction Assistant

---

## Team Name

**RICR** — HackInMotion 2026 · Team ID: `HIM-1084`

---

## Selected Theme

**Healthcare & Patient Safety** — Drug Interaction Detection & Medication Management

---

## Problem Statement

Every day, millions of people take more than one medicine simultaneously — for fever, diabetes, blood pressure, allergies, or other conditions. Most patients do not know that some medicines, when taken together, can react dangerously. This is called a **drug-drug interaction (DDI)**, and it can cause serious side effects, reduce a medicine's effectiveness, or in extreme cases, be life-threatening.

Common scenarios that go unchecked:

- Patients prescribed by different doctors without cross-referencing prescriptions.
- Over-the-counter medicines bought without checking compatibility with existing prescriptions.
- Medicine labels not read or understood by non-medical users.

Hospitals and pharmacies often lack an easy-to-use digital tool to catch these risks in real time — especially for common people who are not medically trained.

---

## Solution Overview

MediGuard is a full-stack web application where a user (patient, caregiver, or pharmacist) can:

1. **Sign up and log in** securely via Supabase Auth.
2. **Build a personal medication cabinet** by searching and adding medicines by name.
3. **Run a Safety Check** — the system screens all cabinet medicines for drug-drug interactions using the **DDInter 2.0** database (10,874 canonical interaction pairs, 1,405 drug mappings, 1,400+ RxNorm-normalized medicines).
4. **View results in plain language** — severity level (Major / Moderate / Minor), what to watch for, and what to do next.
5. **Get personalized warnings** based on their medical conditions (e.g., Asthma + NSAID caution, Renal impairment + Metformin warning).
6. **Review their medication history and past checks** from a personal dashboard.

MediGuard feels like a **trustworthy digital health companion** — not a raw medical data dump.

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| Vite | 8.2 | Build tool & dev server |
| @supabase/supabase-js | 2.112 | Supabase Auth client |
| oxlint | 1.75 | Linter |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Django | 6.1 | Web framework |
| Django REST Framework | 3.18 | REST API layer |
| PyJWT + cryptography | 2.13 / 50.0 | ES256 / RS256 JWT verification |
| psycopg (binary) | 3.3 | PostgreSQL driver |
| django-cors-headers | 4.9 | CORS configuration |
| python-dotenv | 1.2 | Environment variable loading |
| pandas / numpy | 3.0 / 2.5 | Data import pipeline |
| supabase-py | 2.31 | Supabase client (backend) |

### Infrastructure
| Service | Purpose |
|---|---|
| Supabase | Auth (ES256 JWT), PostgreSQL database hosting |
| SQLite | Local development fallback database |

### Data Sources
| Source | Role |
|---|---|
| **DDInter 2.0** | Primary drug-drug interaction database (10,874 pairs) |
| **RxNorm (NLM)** | Medicine normalization & canonical identification (1,400+ medicines) |

---

## Why DDInter 2.0?

DDInter 2.0 was chosen as the core interaction data source after evaluating available options:

- **Coverage**: 10,874 canonical drug-drug interaction pairs across 1,405 unique drug names.
- **Severity Classification**: Already classifies interactions as Major / Moderate / Minor — directly mappable to our risk engine.
- **Offline-capable**: The full dataset is processed and stored locally in the PostgreSQL database — no runtime API dependency or rate limits.
- **RxNorm mapping**: We built a custom mapping pipeline (`ddinter_rxnorm_mapping.csv`) to align DDInter drug names to RxNorm CUIs, enabling standardized medicine search and cross-referencing.

The dataset is stored in `data/interactions/` and imported into the database via the data pipeline scripts.

---

## Installation Guide

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or use the built-in SQLite fallback for local development)
- A Supabase project (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/HackInMotion-RICR-HIM-1084.git
cd HackInMotion-RICR-HIM-1084
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate        # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Apply database migrations
python manage.py migrate

# Start Django development server
python manage.py runserver 8001
```

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
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
```

> `SUPABASE_JWT_ISSUER` and `SUPABASE_JWKS_URL` are derived automatically from `SUPABASE_URL`. Override only if needed.

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
| `POST` | `/api/interactions/check/` | Pairwise drug interaction check | No |
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

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                 │
│                                                                 │
│   React 19 + Vite                                               │
│   ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐    │
│   │  AuthContext │  │  apiClient   │  │  medicineService  │    │
│   │  (Supabase) │  │  (Bearer JWT)│  │  (medicine search)│    │
│   └──────┬──────┘  └──────┬───────┘  └─────────┬─────────┘    │
│          │                │                     │              │
└──────────┼────────────────┼─────────────────────┼──────────────┘
           │                │                     │
           ▼                ▼                     ▼
    ┌─────────────┐  ┌──────────────────────────────────────┐
    │  Supabase   │  │        Vite Dev Proxy /api/*         │
    │  Auth       │  │        → http://127.0.0.1:8001       │
    │  (ES256 JWT)│  └──────────────────┬───────────────────┘
    └─────────────┘                     │
                                        ▼
                    ┌───────────────────────────────────────┐
                    │           DJANGO 6.1 BACKEND          │
                    │                                       │
                    │  SupabaseAuthentication               │
                    │  (verifies ES256 JWT via JWKS)        │
                    │            │                          │
                    │   ┌────────┴────────┐                 │
                    │   ▼                 ▼                 │
                    │  /api/profile/   /api/medicines/      │
                    │  /api/interactions/check/             │
                    │  /api/patients/safety-check/          │
                    │  /api/dashboard/overview/             │
                    │            │                          │
                    │            ▼                          │
                    │   InteractionEngine                   │
                    │   PatientSafetyEngine                 │
                    │            │                          │
                    └────────────┼──────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   PostgreSQL / SQLite  │
                    │                        │
                    │   medicines (1,400+)   │
                    │   drug_interactions    │
                    │   (10,874 pairs)       │
                    │   ddinter_mappings     │
                    │   user_profiles        │
                    └────────────────────────┘
```

---

## Key Design Decisions

### 1. Offline-first DDI database
Rather than calling an external API at query time (latency, rate limits, downtime risk), the entire DDInter 2.0 dataset is pre-processed and loaded into the local database. Interaction checks are pure SQL — fast, reliable, and offline-capable.

### 2. Supabase Auth with Django as security boundary
The frontend uses Supabase Auth directly (no custom auth server). Django verifies the Supabase ES256 JWT on every request via JWKS — the backend never trusts anything from the frontend except the signed token. User identity (`request.user`) is derived from the JWT `sub` claim only.

### 3. RxNorm normalization layer
User inputs (medicine names, brand names, partial matches) are resolved through a four-step pipeline: exact RxCUI → database PK → case-insensitive name → DDInter mapping. This means "paracetamol", "Paracetamol", "PARACETAMOL", and the DDInter alias all resolve to the same canonical medicine record.

### 4. Personalized safety engine
Beyond raw DDI pairs, the `PatientSafetyEngine` overlays condition-specific contraindication rules (Asthma + NSAIDs, Renal impairment + Metformin/NSAIDs, Hypertension + decongestants) to generate warnings tailored to the user's health profile.

---

## Screenshots

> _Screenshots to be added after final UI polish._

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
| **Expanded Data Sources** | Integrate openFDA and DailyMed for richer interaction evidence and drug labels |
| **Interaction History Persistence** | Store each safety check in the database for full longitudinal history |

---

## Disclaimer

> MediGuard is an informational tool built for educational and hackathon purposes. It is **not a substitute for professional medical advice, diagnosis, or treatment**. Always consult a qualified healthcare provider before making any medication decisions.

---

*Built with ❤️ for HackInMotion 2026 — Team RICR (HIM-1084)*
