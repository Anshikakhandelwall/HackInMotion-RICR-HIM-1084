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

---

## 🚢 Deployment Configuration

- **Frontend**: Deployed on Vercel with SPA routing rewrite (`frontend/vercel.json`).
- **Backend**: Containerized with `Dockerfile` and configured for Render / Railway via `Procfile` and `render.yaml`.

---

## 📑 Disclaimer

> MediGuard is an informational tool built for educational and hackathon purposes. It is **not a substitute for professional medical advice, diagnosis, or treatment**. Always consult a qualified healthcare provider before making any medication decisions.

---

*Built with ❤️ for HackInMotion 2026 — Team RICR (HIM-1084)*
