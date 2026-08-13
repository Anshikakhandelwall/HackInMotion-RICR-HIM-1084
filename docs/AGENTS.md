# Agent Working Memory (`AGENTS.md`)

This file serves as persistent working memory for AI coding agents working on the **MediGuard** project (`HackInMotion-RICR-HIM-1084`).

### Current State

* **What has been completed:**
  * Scaffolded React 19 + Vite 8 frontend in `frontend/` directory with scalable directory structure (`components/`, `pages/`, `services/`, `layouts/`, `routes/`, `styles/`, `assets/`).
  * **COMMIT 12 — Profile Validation Implementation ([Profile.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Profile/Profile.jsx) & [Profile.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Profile/Profile.css)):**
    * **Medical History Validation:** Required field rule. Rejects empty or whitespace-only inputs and displays clear field-level error (*"Medical history is required. If you have no major medical history, type NONE."*).
    * **Regular Medicines Validation:** Follows existing data structure rules where empty inputs are valid if user takes no regular medications.
    * **Save Prevention & Input Preservation:** Intercepts `"Save Changes"` click, prevents saving if validation fails, keeps user in edit mode with errors displayed, and preserves typed input.
    * **Cancel Integration:** Discards unsaved edits, clears all field-level validation errors, and restores original values.
    * **Locked Non-Editable Fields:** Name, Email, and Age remain strictly locked and read-only (`(Read-only)` badge).
    * **Visual Consistency:** Light MediGuard design tokens (`#FFFDFC` base, `#FFFFFF` container, `#A63D35` brick red primary accent, `#E9DDD9` warm borders, `#24201F` charcoal typography). Zero blue or dark theme styling.
  * **Commit 11 — Profile Editing UI Implementation:**
    * Edit mode toggle, form fields for Medical History & Regular Medicines, locked Name/Email/Age fields, Save Changes UI button, and Cancel button.
  * **Commit 10 — Read-Only Profile Page Implementation:**
    * Created Profile layout presenting Name, Email, Age, Medical History, and Regular Medicines.
  * Verified production build (`npm run build` — 0 errors, 332ms).
* **What is currently working:**
  * Active Backend (Django 6.1 on port 8000) & Frontend (Vite on port 5173) dev servers.
  * Complete Commit 12 Profile Validation, Commit 11 Profile Editing UI, Commit 10 Read-Only Profile Page, Commit 9 Loading/Empty States, Medicine Search Interface, Current Medicines feature & My Medicines cabinet page.
* **What is partially implemented:**
  * Connecting medicine interaction checker UI to DDInter 2.0 lookup endpoints.
* **What is currently being worked on:** Maintaining detailed agent state memory in `docs/AGENTS.md`.

### Work History

* **2026-08-13 - COMMIT 12 — Profile Validation Implementation:**
  * Updated `Profile.jsx` and `Profile.css` with field-level validation rules for Medical History, save prevention, and error message styling.
  * Verified production build (`npm run build`).
* **2026-08-13 - COMMIT 11 — Profile Editing UI Implementation (Corrected Scope):**
  * Updated `Profile.jsx` and `Profile.css` so Name, Email, and Age are strictly locked as read-only, making ONLY Medical History and Regular Medicines editable.
* **2026-08-13 - COMMIT 10 — Updated Profile Page Presentation:**
  * Updated `Profile.jsx` and `Profile.css` with a unified 2-column grid layout displaying Name, Email, Age, Medical History, and Regular Medicines.

### Current Context

* **Project Title:** MediGuard — Smart Medicine Safety & Drug Interaction Assistant.
* **Current Working Branch:** `feature/frontend-ui`.
* **Key Code Locations:**
  * Profile Validation & Page: [Profile.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Profile/Profile.jsx) & [Profile.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Profile/Profile.css)
* **Active Servers:**
  * Frontend: `http://localhost:5173/`
  * Backend: `http://127.0.0.1:8000/`

### Next Steps

1. Connect medicine interaction checker UI to DDInter 2.0 lookup endpoints.
2. Connect backend REST API endpoints for medicines CRUD.

### Handoff

**Last completed:** Completed Commit 12 - Profile Validation with field-level error messages for Medical History, save-prevention on invalid input, and cancel error clearing.
**Currently doing:** Ready for next feature step.
**Blocked by:** None
**Next action:** Await user command or proceed to next feature step.
