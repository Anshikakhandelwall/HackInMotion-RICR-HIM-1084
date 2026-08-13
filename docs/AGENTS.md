# Agent Working Memory (`AGENTS.md`)

This file serves as persistent working memory for AI coding agents working on the **MediGuard** project (`HackInMotion-RICR-HIM-1084`).

### Current State

* **What has been completed:**
  * Scaffolded React 19 + Vite 8 frontend in `frontend/` directory with scalable directory structure (`components/`, `pages/`, `services/`, `layouts/`, `routes/`, `styles/`, `assets/`).
  * **Commit 9 — Medicine Loading & Empty States Implementation ([Medicines.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Medicines/Medicines.jsx) & [Medicines.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Medicines/Medicines.css)):**
    * **State Logic Integration:**
      - `isLoading === true`: Renders skeleton loading pulse rows (`.medicines-skeleton-list`).
      - `isLoading === false && medicines.length === 0`: Renders clean, centered empty state (*"No medicines added yet"* + *"Add your current medicines to keep track of them in MediGuard."* + `+ Add Medicine` button).
      - `isLoading === false && medicines.length > 0`: Renders existing active medicine list using `<MedicineListItem />`.
    * **Defensive Handling:** Safe fallback array normalization (`Array.isArray(medicineList) ? medicineList : []`) to handle `null`, `undefined`, or empty arrays without crashing.
    * **Visual Consistency:** Strict light MediGuard design tokens (`#FFFDFC` base, `#A63D35` brick red primary accent, `#E9DDD9` warm borders, `#24201F` charcoal typography). Zero blue or dark theme styling.
  * **Medicine Search Interface Implementation (`/medicines`):**
    * Service abstraction `medicineService.js`, `MedicineSearch.jsx` component, duplicate warning toast, and multi-state search handling.
  * **"Current Medicines" Feature Implementation:**
    * Shared `mockMedicines.js` dataset, reusable `MedicineListItem.jsx`, and dynamic `MedicineSummaryCard.jsx`.
  * Verified production build (`npm run build` — 0 errors, 417ms).
* **What is currently working:**
  * Active Backend (Django 6.1 on port 8000) & Frontend (Vite on port 5173) dev servers.
  * Complete Commit 9 Medicine Loading & Empty States, Medicine Search Interface, Current Medicines feature & My Medicines cabinet page.
* **What is partially implemented:**
  * Connecting medicine interaction checker UI to DDInter 2.0 lookup endpoints.
* **What is currently being worked on:** Maintaining detailed agent state memory in `docs/AGENTS.md`.

### Work History

* **2026-08-13 - Commit 9 — Medicine Loading & Empty States Implementation:**
  * Updated `Medicines.jsx` with `isLoading` skeleton list, `medicines.length === 0` empty state, and null defensive handling.
  * Updated `Medicines.css` with skeleton pulse animations.
  * Verified production build (`npm run build`).
* **2026-08-13 - Medicine Search Interface Implementation:**
  * Created `medicineService.js`, `MedicineSearch.jsx` / `.css`.
* **2026-08-13 - Current Medicines Feature Implementation:**
  * Created `mockMedicines.js`, `MedicineListItem.jsx` / `.css`.
* **2026-08-13 - MediGuard Dashboard Overview Content Implementation:**
  * Created `mockDashboardData.js`, `Dashboard.jsx`, `SafetyStatusCard.jsx`, `RecentChecksCard.jsx`, `QuickActions.jsx`.

### Current Context

* **Project Title:** MediGuard — Smart Medicine Safety & Drug Interaction Assistant.
* **Current Working Branch:** `feature/frontend-ui`.
* **Key Code Locations:**
  * Cabinet Page & States: [Medicines.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Medicines/Medicines.jsx) & [Medicines.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Medicines/Medicines.css)
  * Service Abstraction: [medicineService.js](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/services/medicines/medicineService.js)
  * Search Component: [MedicineSearch.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/medicines/MedicineSearch.jsx)
* **Active Servers:**
  * Frontend: `http://localhost:5173/`
  * Backend: `http://127.0.0.1:8000/`

### Next Steps

1. Connect medicine interaction checker UI to DDInter 2.0 lookup endpoints.
2. Connect backend REST API endpoints for medicines CRUD.

### Handoff

**Last completed:** Completed Commit 9 - Medicine Loading and Empty states with skeleton animations, empty state UI, and null defensive handling.
**Currently doing:** Ready for next feature step.
**Blocked by:** None
**Next action:** Await user command or proceed to next feature step.
