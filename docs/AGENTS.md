# Agent Working Memory (`AGENTS.md`)

This file serves as persistent working memory for AI coding agents working on the **MediGuard** project (`HackInMotion-RICR-HIM-1084`).

### Current State

* **What has been completed:**
  * Scaffolded React 19 + Vite 8 frontend in `frontend/` directory with scalable directory structure (`components/`, `pages/`, `services/`, `layouts/`, `routes/`, `styles/`, `assets/`).
  * **Medicine Search Interface Implementation (`/medicines`):**
    * **Service Abstraction ([medicineService.js](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/services/medicines/medicineService.js)):** Created clean service wrapper exposing `searchMedicines(query)` with TODO comment for future backend dataset API connection without fake URLs or mock API claims.
    * **Search Component ([MedicineSearch.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/medicines/MedicineSearch.jsx) & [MedicineSearch.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/medicines/MedicineSearch.css)):**
      - Search bar input with search icon, clear button (`×`), focus states, and keyboard accessibility (Esc/Enter).
      - Handles search query trimming and whitespace checks.
      - **States supported:** Empty query, Integration Placeholder (*"Medicine search will be available when the medicine database is connected."*), Loading (*"Searching medicines..."* + spinner), Results list with `+ Add` button, No Results (*"No medicines found"*), and Error (*"Unable to search medicines."* + *"Try Again"*).
      - **Duplicate Protection:** Checks if medicine already exists in cabinet before adding and displays non-blocking toast warning (`"Medicine is already added"`).
    * **My Medicines Page Integration ([Medicines.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Medicines/Medicines.jsx) & [Medicines.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Medicines/Medicines.css)):**
      - Placed search input alongside `+ Add Medicine` in page header action bar.
      - Desktop layout: `[ Search medicines... ] [ + Add Medicine ]`
      - Mobile layout: Search input full width on top, button below.
  * **"Current Medicines" Feature Implementation:**
    * Shared `mockMedicines.js` dataset, reusable `MedicineListItem.jsx`, and dynamic `MedicineSummaryCard.jsx`.
  * Verified production build (`npm run build` — 0 errors, 773ms).
* **What is currently working:**
  * Active Backend (Django 6.1 on port 8000) & Frontend (Vite on port 5173) dev servers.
  * Complete Medicine Search Interface, Current Medicines feature & My Medicines cabinet page.
* **What is partially implemented:**
  * Connecting medicine interaction checker UI to DDInter 2.0 lookup endpoints.
* **What is currently being worked on:** Maintaining detailed agent state memory in `docs/AGENTS.md`.

### Work History

* **2026-08-13 - Medicine Search Interface Implementation:**
  * Created `medicineService.js`, `MedicineSearch.jsx` / `.css`.
  * Updated `Medicines.jsx` / `.css`.
  * Verified production build (`npm run build`).
* **2026-08-13 - Current Medicines Feature Implementation:**
  * Created `mockMedicines.js`, `MedicineListItem.jsx` / `.css`.
  * Updated `mockDashboardData.js`, `MedicineSummaryCard.jsx` / `.css`, and `Medicines.jsx` / `.css`.
* **2026-08-13 - MediGuard Dashboard Overview Content Implementation:**
  * Created `mockDashboardData.js`, `Dashboard.jsx`, `SafetyStatusCard.jsx`, `RecentChecksCard.jsx`, `QuickActions.jsx`.
* **2026-08-13 - Backend-Persisted First-Login Health Profile Integration:**
  * Created `UserProfile` model, `post_save` signal, `authentication.0001_initial` migration, `UserSerializer` profile fields, `OnboardingProfileView`, `urls.py`, `authService.js`, and `App.jsx`.

### Current Context

* **Project Title:** MediGuard — Smart Medicine Safety & Drug Interaction Assistant.
* **Current Working Branch:** `feature/frontend-ui`.
* **Key Code Locations:**
  * Service Abstraction: [medicineService.js](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/services/medicines/medicineService.js)
  * Search Component: [MedicineSearch.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/medicines/MedicineSearch.jsx) & [MedicineSearch.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/medicines/MedicineSearch.css)
  * Cabinet Page: [Medicines.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Medicines/Medicines.jsx)
* **Active Servers:**
  * Frontend: `http://localhost:5173/`
  * Backend: `http://127.0.0.1:8000/`

### Next Steps

1. Connect medicine interaction checker UI to DDInter 2.0 lookup endpoints.
2. Connect backend REST API endpoints for medicines CRUD.

### Handoff

**Last completed:** Built Medicine Search Interface with service abstraction layer, full search UI states, duplicate protection, and responsive desktop/mobile header layout.
**Currently doing:** Ready for next feature step.
**Blocked by:** None
**Next action:** Await user command or proceed to next feature step.
