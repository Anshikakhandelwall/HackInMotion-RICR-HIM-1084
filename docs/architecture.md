# Project Architecture — MediGuard

## Repository Structure

```
HackInMotion-RICR-HIM-1084/
│
├── backend/
│   ├── apps/
│   │   │
│   │   ├── authentication/
│   │   │   ├── migrations/
│   │   │   │   └── 0001_initial.py
│   │   │   ├── tests/
│   │   │   │   └── test_supabase_auth.py
│   │   │   ├── apps.py
│   │   │   ├── models.py            # UserProfile (age, conditions, medicines, profile_completed)
│   │   │   ├── serializers.py
│   │   │   ├── supabase_auth.py     # SupabaseAuthentication — ES256/RS256/HS256 JWT verification
│   │   │   ├── urls.py              # /api/auth/
│   │   │   └── views.py             # SupabaseMeView
│   │   │
│   │   ├── medicines/
│   │   │   ├── migrations/
│   │   │   │   ├── 0001_initial.py
│   │   │   │   ├── 0002_add_timestamps_to_medicine.py
│   │   │   │   └── 0003_add_ddinter_drug_mapping.py
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py            # Medicine (rxcui, rxnorm_name, tty), DDInterDrugMapping
│   │   │   ├── serializers.py
│   │   │   ├── urls.py              # /api/medicines/
│   │   │   ├── views.py             # MedicineListView, MedicineDetailView, MedicineRxCUIDetailView
│   │   │   └── tests.py
│   │   │
│   │   ├── interactions/
│   │   │   ├── migrations/
│   │   │   │   └── 0001_add_drug_interaction.py
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py            # DrugInteraction (medicine_a, medicine_b, level)
│   │   │   ├── serializers.py
│   │   │   ├── services.py          # InteractionEngine — pairwise DDI check
│   │   │   ├── urls.py              # /api/interactions/
│   │   │   ├── views.py             # InteractionCheckView
│   │   │   └── tests.py
│   │   │
│   │   ├── patients/
│   │   │   ├── migrations/
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py       # PatientProfileSerializer (camelCase aliases)
│   │   │   ├── services.py          # PatientSafetyEngine — DDI + condition warnings
│   │   │   ├── urls.py              # /api/profile/, /api/patients/
│   │   │   ├── views.py             # PatientProfileView, DashboardOverviewView, PersonalizedSafetyCheckView
│   │   │   └── tests.py
│   │   │
│   │   └── ai/
│   │       ├── prompts/
│   │       │   ├── explanation.py
│   │       │   └── safety.py
│   │       ├── providers/
│   │       │   ├── base.py
│   │       │   └── stub.py          # Default stub provider (no network call)
│   │       ├── schemas/
│   │       │   ├── explanation.py
│   │       │   └── interaction.py
│   │       ├── services/
│   │       │   ├── ai_service.py
│   │       │   ├── explanation_service.py
│   │       │   └── provider_service.py
│   │       ├── tests/
│   │       │   └── test_explanation.py
│   │       ├── validators/
│   │       │   └── safety.py
│   │       └── apps.py
│   │
│   ├── config/
│   │   ├── settings.py              # Django settings, Supabase JWT config, DB config
│   │   ├── urls.py                  # Root URL routing
│   │   ├── asgi.py
│   │   └── wsgi.py
│   │
│   ├── manage.py
│   ├── requirements.txt
│   └── .env                         # (gitignored) DB_*, SUPABASE_URL, SUPABASE_KEY
│
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx                 # App entry point — mounts AuthProvider + App
│   │   ├── App.jsx                  # State-machine router (loading/login/signup/onboarding/dashboard)
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Supabase auth state (user, session, loading, authEvent)
│   │   │
│   │   ├── hooks/
│   │   │   └── useAuth.js           # useContext(AuthContext) shorthand
│   │   │
│   │   ├── services/
│   │   │   ├── api/
│   │   │   │   └── apiClient.js     # apiFetch() — attaches Bearer token, handles 401 auto-logout
│   │   │   ├── auth/
│   │   │   │   ├── supabaseClient.js     # Single Supabase client instance
│   │   │   │   ├── authService.js        # signIn, signUp, signOut, getSession, resetPassword
│   │   │   │   └── backendAuthService.js # GET /api/auth/supabase/me/
│   │   │   ├── profile/
│   │   │   │   └── profileService.js    # getProfile(), createProfile(), updateProfile()
│   │   │   ├── medicines/
│   │   │   │   └── medicineService.js   # searchMedicines() → GET /api/medicines/
│   │   │   ├── interactions/
│   │   │   │   └── interactionService.js # checkInteractions() → POST /api/interactions/check/
│   │   │   └── history/
│   │   │       └── historyService.js
│   │   │
│   │   ├── pages/
│   │   │   ├── Login/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Login.css
│   │   │   ├── Signup/
│   │   │   │   ├── Signup.jsx
│   │   │   │   └── Signup.css
│   │   │   ├── ForgotPassword/
│   │   │   │   └── ForgotPasswordPage.jsx
│   │   │   ├── ResetPassword/
│   │   │   │   └── ResetPasswordPage.jsx
│   │   │   ├── HealthProfile/
│   │   │   │   ├── HealthProfilePage.jsx
│   │   │   │   └── HealthProfilePage.css
│   │   │   ├── Dashboard/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   └── Dashboard.css
│   │   │   ├── Medicines/
│   │   │   │   ├── Medicines.jsx
│   │   │   │   └── Medicines.css
│   │   │   ├── SafetyCheck/
│   │   │   │   ├── SafetyCheck.jsx
│   │   │   │   ├── SafetyCheck.css
│   │   │   │   ├── InteractionDetails.jsx
│   │   │   │   └── InteractionDetails.css
│   │   │   ├── History/
│   │   │   │   ├── History.jsx
│   │   │   │   ├── History.css
│   │   │   │   └── HistoryDetails.jsx
│   │   │   ├── Profile/
│   │   │   │   ├── Profile.jsx
│   │   │   │   └── Profile.css
│   │   │   ├── Settings/
│   │   │   │   └── SettingsPage.jsx
│   │   │   └── Landing/
│   │   │       ├── LandingPage.jsx
│   │   │       └── LandingPage.css
│   │   │
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx + .css
│   │   │   │   ├── RegisterForm.jsx + .css
│   │   │   │   └── HealthProfileForm.jsx + .css
│   │   │   ├── common/
│   │   │   │   ├── BrandLogo.jsx
│   │   │   │   ├── Button.jsx + .css
│   │   │   │   ├── Input.jsx + .css
│   │   │   │   ├── HealthcareIllustration.jsx
│   │   │   │   └── TimePickerModal.jsx + .css
│   │   │   ├── dashboard/
│   │   │   │   ├── Header.jsx + .css
│   │   │   │   ├── Sidebar.jsx + .css
│   │   │   │   ├── MedicineSummaryCard.jsx + .css
│   │   │   │   ├── QuickActions.jsx + .css
│   │   │   │   ├── RecentChecksCard.jsx + .css
│   │   │   │   └── SafetyStatusCard.jsx + .css
│   │   │   ├── medicines/
│   │   │   │   ├── MedicineSearch.jsx + .css
│   │   │   │   └── MedicineListItem.jsx + .css
│   │   │   ├── interactions/       # (placeholder)
│   │   │   └── history/            # (placeholder)
│   │   │
│   │   ├── data/
│   │   │   ├── mockDashboardData.js
│   │   │   └── mockMedicines.js
│   │   │
│   │   ├── assets/
│   │   │   └── hero.png
│   │   │
│   │   ├── styles/
│   │   │   └── global.css
│   │   │
│   │   ├── layouts/                # (placeholder)
│   │   ├── routes/                 # (placeholder)
│   │   └── utils/                  # (placeholder)
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js               # Dev server port 5173, proxy /api → :8001
│   └── .env.local                   # (gitignored) VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
│
│
├── data/
│   ├── interactions/
│   │   ├── DDInter_raw.csv          # Original DDInter 2.0 dataset
│   │   ├── DDInter_processed.csv    # Cleaned & normalized interaction pairs
│   │   ├── ddinter_unique_drugs.csv # Unique drug names extracted from DDInter
│   │   └── ddinter_rxnorm_mapping.csv # DDInter drug name → RxNorm CUI mapping
│   ├── medicines/                   # (reserved for medicine alias / brand data)
│   └── sources/                     # (reserved for source attribution)
│
│
├── scripts/
│   ├── import_all_data.py           # Master import runner
│   ├── import_medicines.py          # Seeds Medicine table from RxNorm data
│   ├── import_ddinter_mappings.py   # Seeds DDInterDrugMapping table
│   ├── import_drug_interactions.py  # Seeds DrugInteraction table from processed CSV
│   ├── process_ddinter.py           # Processes raw DDInter CSV → normalized form
│   ├── map_ddinter_rxnorm.py        # Maps DDInter drug names to RxNorm CUIs
│   ├── fix_rxnorm_mapping.py        # Fixes / audits RxNorm mapping collisions
│   ├── _audit_collisions.py         # Internal audit tool for duplicate mappings
│   └── test_rxnorm.py               # Tests RxNorm API queries
│
│
├── docs/
│   ├── architecture.md              # This file — actual project structure
│   └── database.md                  # Full database schema and ER diagram
│
│
├── .env.example                     # Template for all environment variables
├── .gitignore
└── README.md                        # Full project documentation for judges
```

---

## Layer Responsibilities

### Backend (`backend/`)

| Layer | Responsibility |
|---|---|
| `config/` | Django project settings, root URL routing, WSGI/ASGI entry |
| `apps/authentication/` | Supabase JWT verification (ES256/RS256/HS256), `UserProfile` model, `/api/auth/` routes |
| `apps/medicines/` | `Medicine` + `DDInterDrugMapping` models, medicine search API (`/api/medicines/`) |
| `apps/interactions/` | `DrugInteraction` model, `InteractionEngine` pairwise DDI service, `/api/interactions/check/` |
| `apps/patients/` | `PatientSafetyEngine` (DDI + condition warnings), profile API (`/api/profile/`), dashboard overview |
| `apps/ai/` | AI explanation layer — stub provider by default, pluggable LLM providers |

### Frontend (`frontend/src/`)

| Layer | Responsibility |
|---|---|
| `context/AuthContext.jsx` | Supabase auth state — user, session, loading, authEvent |
| `hooks/useAuth.js` | Shorthand hook for AuthContext |
| `services/auth/` | Supabase client, signIn/Up/Out, JWT session management |
| `services/api/apiClient.js` | Central fetch wrapper — attaches Bearer token, handles 401 auto-logout |
| `services/profile/` | `GET/POST/PATCH /api/profile/` |
| `services/medicines/` | `GET /api/medicines/?search=` |
| `services/interactions/` | `POST /api/interactions/check/` |
| `services/history/` | Interaction check history |
| `pages/` | Full-page views rendered by the App.jsx state machine |
| `components/` | Reusable UI components (auth forms, dashboard cards, medicine search) |
| `data/` | Local mock data (used while backend integration is in progress) |

### Data Pipeline (`data/` + `scripts/`)

| File | Responsibility |
|---|---|
| `DDInter_raw.csv` | Source: DDInter 2.0 — original drug-drug interaction pairs |
| `DDInter_processed.csv` | Normalized pairs with canonical severity levels |
| `ddinter_rxnorm_mapping.csv` | Maps DDInter drug names to RxNorm CUIs for cross-referencing |
| `scripts/import_all_data.py` | One-command seeder: runs all import scripts in correct order |
| `scripts/import_medicines.py` | Populates `medicines` table (1,400+ RxNorm entries) |
| `scripts/import_drug_interactions.py` | Populates `drug_interactions` table (10,874 pairs) |

---

## Request Flow

```
Browser
  │
  ├── Auth requests
  │     └── supabase.auth.signInWithPassword()
  │           → Supabase Auth (ES256 JWT issued)
  │
  └── API requests
        └── apiFetch('/api/...')
              │  Authorization: Bearer <supabase_jwt>
              ▼
        Vite Proxy (:5173 → :8001)
              ▼
        Django
              │
              ├── SupabaseAuthentication
              │     └── Verifies ES256 JWT via JWKS
              │           → get_or_create Django User(username=sub)
              │
              └── View / Service
                    ├── PatientProfileView    → UserProfile CRUD
                    ├── MedicineListView      → Medicine search
                    ├── InteractionCheckView  → InteractionEngine.check_interactions()
                    ├── DashboardOverviewView → PatientSafetyEngine.evaluate_patient_safety()
                    └── PersonalizedSafetyCheckView → DDI + condition warnings
```
