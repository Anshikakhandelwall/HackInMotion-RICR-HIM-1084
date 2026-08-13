# Agent Working Memory (`AGENTS.md`)

This file serves as persistent working memory for AI coding agents working on the **MediGuard** project (`HackInMotion-RICR-HIM-1084`).

### Current State

* **What has been completed:**
  * Scaffolded React 19 + Vite 8 frontend in `frontend/` directory with scalable directory structure (`components/`, `pages/`, `services/`, `layouts/`, `routes/`, `styles/`, `assets/`).
  * **COMMIT 11 — Profile Editing UI Implementation ([Profile.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Profile/Profile.jsx) & [Profile.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Profile/Profile.css)):**
    * **Edit Profile Trigger:** Added `"Edit Profile"` button to the read-only view header.
    * **Editable Fields (ONLY 2):**
      - ✅ **Medical History:** Becomes an editable `<textarea>` pre-filled with current value.
      - ✅ **Regular Medicines:** Becomes an editable `<input>` pre-filled with current value.
    * **Locked Non-Editable Fields (STRICTLY 3):**
      - 🔒 **Name:** Completely non-editable in both read-only and edit mode (`(Read-only)` badge).
      - 🔒 **Email:** Completely non-editable in both read-only and edit mode (`(Read-only)` badge).
      - 🔒 **Age:** Completely non-editable in both read-only and edit mode (`(Read-only)` badge).
    * **Save & Cancel UI:**
      - `"Save Changes"` primary button (UI trigger for Commit 11).
      - `"Cancel"` button: discards unsaved local changes, restores original Medical History & Regular Medicines values, and returns to read-only mode.
    * **No Validation Enforcement:** Strictly zero validation rules or error messages added as required by Commit 11 scope.
    * **Visual Consistency:** Light MediGuard design tokens (`#FFFDFC` base, `#FFFFFF` container, `#A63D35` brick red primary accent, `#E9DDD9` warm borders, `#24201F` charcoal typography). Zero blue or dark theme styling.
  * Verified production build (`npm run build` — 0 errors, 333ms).
* **What is currently working:**
  * Active Backend (Django 6.1 on port 8000) & Frontend (Vite on port 5173) dev servers.
  * Complete Commit 11 Profile Editing UI, Commit 10 Read-Only Profile Page, Commit 9 Loading/Empty States, Medicine Search Interface, Current Medicines feature & My Medicines cabinet page.
* **What is partially implemented:**
  * Connecting medicine interaction checker UI to DDInter 2.0 lookup endpoints.
* **What is currently being worked on:** Maintaining detailed agent state memory in `docs/AGENTS.md`.

### Work History

* **2026-08-13 - COMMIT 11 — Profile Editing UI Implementation (Corrected Scope):**
  * Updated `Profile.jsx` and `Profile.css` so Name, Email, and Age are strictly locked as read-only, making ONLY Medical History and Regular Medicines editable.
  * Verified production build (`npm run build`).
* **2026-08-13 - COMMIT 10 — Updated Profile Page Presentation:**
  * Updated `Profile.jsx` and `Profile.css` with a unified 2-column grid layout displaying Name, Email, Age, Medical History, and Regular Medicines.

### Current Context

* **Project Title:** MediGuard — Smart Medicine Safety & Drug Interaction Assistant.
* **Current Working Branch:** `feature/frontend-ui`.
* **Key Code Locations:**
  * Profile Page & Edit UI: [Profile.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Profile/Profile.jsx) & [Profile.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Profile/Profile.css)
* **Active Servers:**
  * Frontend: `http://localhost:5173/`
  * Backend: `http://127.0.0.1:8000/`

### Next Steps

1. Connect medicine interaction checker UI to DDInter 2.0 lookup endpoints.
2. Connect backend REST API endpoints for medicines CRUD.

### Handoff

**Last completed:** Completed Commit 11 - Profile Editing UI with locked Name/Email/Age fields, editable Medical History & Regular Medicines, Save Changes UI button, and Cancel button.
**Currently doing:** Ready for next feature step.
**Blocked by:** None
**Next action:** Await user command or proceed to next feature step.
