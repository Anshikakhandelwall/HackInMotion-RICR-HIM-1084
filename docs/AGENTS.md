# Agent Working Memory (`AGENTS.md`)

This file serves as persistent working memory for AI coding agents working on the **MediGuard** project (`HackInMotion-RICR-HIM-1084`).

### Current State

* **What has been completed:**
  * Scaffolded React 19 + Vite 8 frontend in `frontend/` directory with scalable directory structure (`components/`, `pages/`, `services/`, `layouts/`, `routes/`, `styles/`, `assets/`).
  * **COMMIT 13 — Profile Save States Implementation ([Profile.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Profile/Profile.jsx) & [Profile.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Profile/Profile.css)):**
    * **Saving / Loading State:** `isSaving = true` state disables Save Changes and Cancel buttons, sets button text to `"Saving..."`, disables form inputs, and prevents duplicate submissions.
    * **Success State:** Displays clean success banner (*"✓ Profile updated successfully."*), updates session user state across the app, and returns to read-only view.
    * **Save Failure State:** Captures save errors, displays error alert (*"⚠️ Unable to save your profile. Please try again."*), keeps user in Edit mode, and preserves typed form inputs.
    * **Retry Capability:** Re-enables Save button after failure so user can click `"Save Changes"` again without re-entering details.
    * **Validation Order Enforced:** Runs `validateForm()` FIRST before starting saving state.
    * **Service Architecture:** Connects seamlessly with existing `saveHealthProfile` service (`POST /api/auth/profile/onboarding/`).
    * **Visual Consistency:** Light MediGuard design tokens (`#FFFDFC` base, `#FFFFFF` container, `#A63D35` brick red primary accent, `#E9DDD9` warm borders, `#24201F` charcoal typography). Zero blue or dark theme styling.
  * **Commit 12 — Profile Validation Implementation:**
    * Required validation for Medical History field with error messaging and save prevention.
  * **Commit 11 — Profile Editing UI Implementation:**
    * Edit mode toggle, form fields for Medical History & Regular Medicines, locked Name/Email/Age fields, Save Changes UI button, and Cancel button.
  * Verified production build (`npm run build` — 0 errors, 361ms).
* **What is currently working:**
  * Active Backend (Django 6.1 on port 8000) & Frontend (Vite on port 5173) dev servers.
  * Complete Commit 13 Profile Save States, Commit 12 Profile Validation, Commit 11 Profile Editing UI, Commit 10 Read-Only Profile Page, Commit 9 Loading/Empty States, Medicine Search Interface, Current Medicines feature & My Medicines cabinet page.
* **What is partially implemented:**
  * Connecting medicine interaction checker UI to DDInter 2.0 lookup endpoints.
* **What is currently being worked on:** Maintaining detailed agent state memory in `docs/AGENTS.md`.

### Work History

* **2026-08-13 - COMMIT 13 — Profile Save States Implementation:**
  * Updated `Profile.jsx` and `Profile.css` with saving state (`Saving...`), success notification toast, save failure banner, and retry capability integrated with `saveHealthProfile`.
  * Updated `App.jsx` to pass `onUpdateUser={setCurrentUser}` prop.
  * Verified production build (`npm run build`).
* **2026-08-13 - COMMIT 12 — Profile Validation Implementation:**
  * Updated `Profile.jsx` and `Profile.css` with field-level validation rules for Medical History, save prevention, and error message styling.

### Current Context

* **Project Title:** MediGuard — Smart Medicine Safety & Drug Interaction Assistant.
* **Current Working Branch:** `feature/frontend-ui`.
* **Key Code Locations:**
  * Profile Save States & Page: [Profile.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Profile/Profile.jsx) & [Profile.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Profile/Profile.css)
* **Active Servers:**
  * Frontend: `http://localhost:5173/`
  * Backend: `http://127.0.0.1:8000/`

### Next Steps

1. Connect medicine interaction checker UI to DDInter 2.0 lookup endpoints.
2. Connect backend REST API endpoints for medicines CRUD.

### Handoff

**Last completed:** Completed Commit 13 - Profile Save States with saving loading indicator, success notification, failure banner, data preservation, and retry integration with authService.
**Currently doing:** Ready for next feature step.
**Blocked by:** None
**Next action:** Await user command or proceed to next feature step.
