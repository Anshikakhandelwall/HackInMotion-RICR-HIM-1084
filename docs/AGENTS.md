# Agent Working Memory (`AGENTS.md`)

This file serves as persistent working memory for AI coding agents working on the **MediGuard** project (`HackInMotion-RICR-HIM-1084`).

### Current State

* **What has been completed:**
  * Scaffolded React 19 + Vite 8 frontend in `frontend/` directory with scalable directory structure (`components/`, `pages/`, `services/`, `layouts/`, `routes/`, `styles/`, `assets/`).
  * Built complete **Register (Signup) Page** and **Login Page** with Light Theme design tokens (`#FFFDFC` background, `#A6534B` primary button, `#B8665E` border/focus accent, `#2B2524` charcoal text).
  * **Commit 2 — First-Login Health Profile Onboarding Flow:**
    * Created [HealthProfileForm.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/auth/HealthProfileForm.jsx) & [HealthProfileForm.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/auth/HealthProfileForm.css).
    * Created [HealthProfilePage.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/HealthProfile/HealthProfilePage.jsx) & [HealthProfilePage.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/HealthProfile/HealthProfilePage.css).
    * Updated [authService.js](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/services/auth/authService.js) and [App.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/App.jsx).
    * Fixed onboarding navigation logic so registration navigates to Login page and onboarding triggers ONLY on first login.
  * **Servers Running:**
    * Backend: Django 6.1 server running on `http://127.0.0.1:8000/`.
    * Frontend: Vite dev server running on `http://localhost:5173/`.
* **What is currently working:**
  * Active Backend & Frontend dev servers.
  * Correct registration, login, and onboarding navigation flows.
* **What is partially implemented:**
  * Connecting frontend REST API endpoints with Django views.
* **What is currently being worked on:** Maintaining detailed agent state memory in `docs/AGENTS.md`.

### Work History

* **2026-08-13 - Launched Backend & Frontend Servers:**
  * Started Django 6.1 server (`python manage.py runserver 8000`).
  * Started Vite frontend server (`npm run dev`).
* **2026-08-13 - Health Profile Onboarding Navigation Flow Fix:**
  * Fixed `RegisterForm.jsx` and `App.jsx` navigation handlers.
  * Verified all 5 test scenarios.

### Current Context

* **Project Title:** MediGuard — Smart Medicine Safety & Drug Interaction Assistant.
* **Current Working Branch:** `main`.
* **Active Servers:**
  * Frontend: `http://localhost:5173/`
  * Backend: `http://127.0.0.1:8000/`

### Next Steps

1. Build medicine interaction checker & cabinet UI in `src/pages/SafetyCheck/` and `src/pages/Medicines/`.
2. Connect backend REST API endpoints.

### Handoff

**Last completed:** Launched both backend (port 8000) and frontend servers.
**Currently doing:** Both dev servers running cleanly; ready for next feature.
**Blocked by:** None
**Next action:** Await user command or proceed to next feature step.
