# Agent Working Memory (`AGENTS.md`)

This file serves as persistent working memory for AI coding agents working on the **MediGuard** project (`HackInMotion-RICR-HIM-1084`).

### Current State

* **What has been completed:**
  * Scaffolded React 19 + Vite 8 frontend in `frontend/` directory with scalable directory structure (`components/`, `pages/`, `services/`, `layouts/`, `routes/`, `styles/`, `assets/`).
  * **COMMIT — Dashboard Responsive Layout & Card Positions Swap ([Dashboard.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Dashboard/Dashboard.jsx) & [Dashboard.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Dashboard/Dashboard.css)):**
    * **Card Position Swap:** Swapped main grid card positions:
      - **LEFT Position:** `Current Medicines` Card (`<MedicineSummaryCard />`)
      - **RIGHT Position:** `Safety Overview` Card (`<SafetyStatusCard />`)
    * **Responsive Layout:**
      - **Desktop:** Balanced 2-column grid (`Current Medicines` on LEFT, `Safety Overview` on RIGHT, `Recent Safety Checks` full-width below).
      - **Tablet & Mobile:** Single-column stacking order (1. `Current Medicines` ➔ 2. `Safety Overview` ➔ 3. `Recent Safety Checks`).
      - Zero horizontal page overflow, zero clipped buttons, and zero broken text.
    * **Visual Consistency:** Preserved strict light MediGuard design tokens (`#FFFDFC` base, `#FFFFFF` cards, `#A63D35` brick red primary accent, `#E9DDD9` warm borders, `#24201F` charcoal typography). Zero blue or dark theme styling.
  * **Commit 13 — Profile Save States Implementation:**
    * Saving indicator (`Saving...`), success toast notification, save error banner, and retry capability.
  * **Commit 12 — Profile Validation Implementation:**
    * Required validation for Medical History field with error messaging and save prevention.
  * Verified production build (`npm run build` — 0 errors, 370ms).
* **What is currently working:**
  * Active Backend (Django 6.1 on port 8000) & Frontend (Vite on port 5173) dev servers.
  * Complete Responsive Dashboard with Swapped Cards, Commit 13 Profile Save States, Commit 12 Profile Validation, Commit 11 Profile Editing UI, Commit 10 Read-Only Profile Page, Commit 9 Loading/Empty States, Medicine Search Interface, Current Medicines feature & My Medicines cabinet page.
* **What is partially implemented:**
  * Connecting medicine interaction checker UI to DDInter 2.0 lookup endpoints.
* **What is currently being worked on:** Maintaining detailed agent state memory in `docs/AGENTS.md`.

### Work History

* **2026-08-13 - COMMIT — Dashboard Responsive Layout & Card Positions Swap:**
  * Updated `Dashboard.jsx` to swap `Current Medicines` (LEFT) and `Safety Overview` (RIGHT).
  * Updated `Dashboard.css` for responsive tablet and mobile stacking.
  * Verified production build (`npm run build`).
* **2026-08-13 - COMMIT 13 — Profile Save States Implementation:**
  * Updated `Profile.jsx` and `Profile.css` with saving state (`Saving...`), success notification toast, save failure banner, and retry capability.

### Current Context

* **Project Title:** MediGuard — Smart Medicine Safety & Drug Interaction Assistant.
* **Current Working Branch:** `feature/frontend-ui`.
* **Key Code Locations:**
  * Dashboard Layout: [Dashboard.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Dashboard/Dashboard.jsx) & [Dashboard.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Dashboard/Dashboard.css)
* **Active Servers:**
  * Frontend: `http://localhost:5173/`
  * Backend: `http://127.0.0.1:8000/`

### Next Steps

1. Connect medicine interaction checker UI to DDInter 2.0 lookup endpoints.
2. Connect backend REST API endpoints for medicines CRUD.

### Handoff

**Last completed:** Completed Dashboard responsive layout improvement and swapped card positions (Current Medicines on LEFT, Safety Overview on RIGHT).
**Currently doing:** Ready for next feature step.
**Blocked by:** None
**Next action:** Await user command or proceed to next feature step.
