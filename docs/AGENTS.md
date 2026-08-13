# Agent Working Memory (`AGENTS.md`)

This file serves as persistent working memory for AI coding agents working on the **MediGuard** project (`HackInMotion-RICR-HIM-1084`).

### Current State

* **What has been completed:**
  * Scaffolded React 19 + Vite 8 frontend in `frontend/` directory with scalable directory structure (`components/`, `pages/`, `services/`, `layouts/`, `routes/`, `styles/`, `assets/`).
  * **COMMIT 10 — Updated Profile Page Presentation ([Profile.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Profile/Profile.jsx) & [Profile.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Profile/Profile.css)):**
    * **Unified Information Container:** Replaced the three separate stacked blocks with a single clean, balanced Profile container (`max-width: 920px`) that better utilizes page whitespace.
    * **Fields Displayed:**
      - **Name** (`currentUser.fullName` / `full_name` or fallback `"Not available"`)
      - **Email** (`currentUser.email` or fallback `"Not available"`)
      - **Age** (`currentUser.age` or fallback `"Not available"`)
      - **Medical History** (`currentUser.medicalConditions` or fallback `"None"`)
      - **Regular Medicines** (Pill tags list or `"None"` fallback)
    * **Strict Read-Only Enforcement:** Zero edit buttons, edit icons, inputs, save/update/delete buttons, or form logic added.
    * **Visual Consistency:** Light MediGuard design tokens (`#FFFDFC` base, `#FFFFFF` container, `#A63D35` brick red primary accent, `#E9DDD9` warm borders, `#24201F` charcoal typography). Zero blue or dark theme styling.
  * Verified production build (`npm run build` — 0 errors, 305ms).
* **What is currently working:**
  * Active Backend (Django 6.1 on port 8000) & Frontend (Vite on port 5173) dev servers.
  * Complete Commit 10 Read-Only Profile Page layout update.
* **What is partially implemented:**
  * Connecting medicine interaction checker UI to DDInter 2.0 lookup endpoints.
* **What is currently being worked on:** Maintaining detailed agent state memory in `docs/AGENTS.md`.

### Work History

* **2026-08-13 - COMMIT 10 — Updated Profile Page Presentation:**
  * Updated `Profile.jsx` and `Profile.css` with a unified, balanced 2-column grid layout displaying Name, Email, Age, Medical History, and Regular Medicines.
  * Verified production build (`npm run build`).
* **2026-08-13 - Commit 9 — Medicine Loading & Empty States Implementation:**
  * Updated `Medicines.jsx` with `isLoading` skeleton list, `medicines.length === 0` empty state, and null defensive handling.
* **2026-08-13 - Medicine Search Interface Implementation:**
  * Created `medicineService.js`, `MedicineSearch.jsx` / `.css`.

### Current Context

* **Project Title:** MediGuard — Smart Medicine Safety & Drug Interaction Assistant.
* **Current Working Branch:** `feature/frontend-ui`.
* **Key Code Locations:**
  * Read-Only Profile Page: [Profile.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Profile/Profile.jsx) & [Profile.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Profile/Profile.css)
* **Active Servers:**
  * Frontend: `http://localhost:5173/`
  * Backend: `http://127.0.0.1:8000/`

### Next Steps

1. Connect medicine interaction checker UI to DDInter 2.0 lookup endpoints.
2. Connect backend REST API endpoints for medicines CRUD.

### Handoff

**Last completed:** Updated Commit 10 Profile Page presentation with a unified 2-column container displaying Name, Email, Age, Medical History, and Regular Medicines in a read-only layout.
**Currently doing:** Ready for next feature step.
**Blocked by:** None
**Next action:** Await user command or proceed to next feature step.
