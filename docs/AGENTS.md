# Agent Working Memory (`AGENTS.md`)

This file serves as persistent working memory for AI coding agents working on the **MediGuard** project (`HackInMotion-RICR-HIM-1084`).

### Current State

* **What has been completed:**
  * Scaffolded React 19 + Vite 8 frontend in `frontend/` directory with scalable directory structure (`components/`, `pages/`, `services/`, `layouts/`, `routes/`, `styles/`, `assets/`).
  * **COMMIT 14 — Mobile Navigation Trigger Implementation ([Header.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/dashboard/Header.jsx) & [Header.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/dashboard/Header.css)):**
    * **Hamburger Menu Button:** Added mobile hamburger toggle button to top Header bar, hidden on desktop (`> 860px`) and visible on small screens (`<= 860px`).
    * **Dynamic Accessible State:** Configured dynamic `aria-label` (`"Open menu"` / `"Close menu"`) and dynamic icon transition (Hamburger `☰` ➔ Close `X`).
    * **Responsive Sidebar Visibility:** Hides desktop sidebar from flow on small screens while preserving desktop sidebar 100% untouched on desktop screens.
    * **Local Open/Close State:** Managed `isMobileMenuOpen` state in `App.jsx` and passed to `Header` without rendering a new mobile panel (preparing foundation for the next mobile navigation commit).
    * **Visual Consistency:** Light MediGuard design tokens (`#FFFDFC` base, `#A63D35` primary accent, `#E9DDD9` warm borders, `#24201F` charcoal typography). Zero blue or dark theme styling.
  * **Commit — Dashboard Responsive Layout & Card Swap:**
    * Swapped card positions (Current Medicines on LEFT, Safety Overview on RIGHT) and responsive tablet/mobile grid.
  * Verified production build (`npm run build` — 0 errors, 381ms).
* **What is currently working:**
  * Active Backend (Django 6.1 on port 8000) & Frontend (Vite on port 5173) dev servers.
  * Complete Commit 14 Mobile Navigation Trigger, Responsive Dashboard with Swapped Cards, Commit 13 Profile Save States, Commit 12 Profile Validation, Commit 11 Profile Editing UI, Commit 10 Read-Only Profile Page, Commit 9 Loading/Empty States, Medicine Search Interface, Current Medicines feature & My Medicines cabinet page.
* **What is partially implemented:**
  * Connecting medicine interaction checker UI to DDInter 2.0 lookup endpoints.
* **What is currently being worked on:** Maintaining detailed agent state memory in `docs/AGENTS.md`.

### Work History

* **2026-08-13 - COMMIT 14 — Mobile Navigation Trigger Implementation:**
  * Updated `Header.jsx`, `Header.css`, and `App.jsx` with mobile hamburger trigger button, dynamic `aria-label`, toggle icons, and local open/close state.
  * Verified production build (`npm run build`).
* **2026-08-13 - COMMIT — Dashboard Responsive Layout & Card Positions Swap:**
  * Updated `Dashboard.jsx` to swap `Current Medicines` (LEFT) and `Safety Overview` (RIGHT).

### Current Context

* **Project Title:** MediGuard — Smart Medicine Safety & Drug Interaction Assistant.
* **Current Working Branch:** `feature/frontend-ui`.
* **Key Code Locations:**
  * Header & Mobile Trigger: [Header.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/dashboard/Header.jsx) & [Header.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/dashboard/Header.css)
* **Active Servers:**
  * Frontend: `http://localhost:5173/`
  * Backend: `http://127.0.0.1:8000/`

### Next Steps

1. Connect medicine interaction checker UI to DDInter 2.0 lookup endpoints.
2. Connect backend REST API endpoints for medicines CRUD.

### Handoff

**Last completed:** Completed Commit 14 - Mobile Navigation Trigger with hamburger button, dynamic accessible labels/icons, responsive sidebar hiding, and local open/close state.
**Currently doing:** Ready for next feature step.
**Blocked by:** None
**Next action:** Await user command or proceed to next feature step.
