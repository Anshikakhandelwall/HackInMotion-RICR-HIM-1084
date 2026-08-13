# Agent Working Memory (`AGENTS.md`)

This file serves as persistent working memory for AI coding agents working on the **MediGuard** project (`HackInMotion-RICR-HIM-1084`).

### Current State

* **What has been completed:**
  * Scaffolded React 19 + Vite 8 frontend in `frontend/` directory with scalable directory structure (`components/`, `pages/`, `services/`, `layouts/`, `routes/`, `styles/`, `assets/`).
  * **MediGuard Dashboard Shell & Navigation Layout:**
    * **App Shell Architecture:** Created persistent application shell in [App.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/App.jsx) containing persistent `<Sidebar />` and `<Header />`.
    * **Sidebar Component ([Sidebar.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/dashboard/Sidebar.jsx) & [Sidebar.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/dashboard/Sidebar.css)):** Vertical navigation menu containing `BrandLogo`, navigation items (Dashboard `/dashboard`, My Medicines `/medicines`, Safety Check `/safety-check`, History `/history`, Profile `/profile`, Settings `/settings`), and Logout handler. Features warm reddish/peach active highlights and mobile responsive drawer toggle.
    * **Top Header Component ([Header.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/dashboard/Header.jsx) & [Header.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/dashboard/Header.css)):** Left greeting *"Good morning, [User Name] 👋"* + subtext *"Here's your medication safety overview"*. Right notification bell badge and user avatar initials badge.
    * **Dashboard Content Grid Cards:**
      * **Current Medicines Card ([MedicineSummaryCard.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/dashboard/MedicineSummaryCard.jsx)):** Count badge (*"3 medicines"*), mock entries (Paracetamol, Metformin, Amlodipine), and `+ Add Medicine` button.
      * **Safety Status Card ([SafetyStatusCard.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/dashboard/SafetyStatusCard.jsx)):** Risk assessment, *"2 Active Warnings"* pill, and `Check Safety` CTA.
      * **Recent Checks Section ([RecentChecksCard.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/dashboard/RecentChecksCard.jsx)):** Historical screening entries with severity badges (`1 Severe`, `1 Moderate`, `No interactions found`) and *"View all"* link.
      * **Quick Actions Bar ([QuickActions.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/dashboard/QuickActions.jsx)):** `+ Add Medicine`, `🛡️ Check Safety`, `📋 View History`.
    * **Sub-Page Navigation Placeholders:** Created clean sub-pages for `/medicines`, `/safety-check`, `/history`, `/profile`, `/settings` that preserve the persistent Dashboard Shell layout when navigating.
  * Verified production build (`npm run build` — 0 errors, 385ms).
* **What is currently working:**
  * Active Backend (Django 6.1 on port 8000) & Frontend (Vite on port 5173) dev servers.
  * Complete MediGuard Dashboard Application Shell & Navigation.
* **What is partially implemented:**
  * Connecting medicine interaction checker & cabinet UI to DDInter 2.0 lookup endpoints.
* **What is currently being worked on:** Maintaining detailed agent state memory in `docs/AGENTS.md`.

### Work History

* **2026-08-13 - MediGuard Dashboard Shell & Navigation Layout Implementation:**
  * Created `Sidebar.jsx` / `Sidebar.css`, `Header.jsx` / `Header.css`, `MedicineSummaryCard.jsx` / `MedicineSummaryCard.css`, `SafetyStatusCard.jsx` / `SafetyStatusCard.css`, `RecentChecksCard.jsx` / `RecentChecksCard.css`, `QuickActions.jsx` / `QuickActions.css`, `Dashboard.jsx` / `Dashboard.css`, and sub-pages `Medicines.jsx`, `SafetyCheck.jsx`, `History.jsx`, `Profile.jsx`, `SettingsPage.jsx`.
  * Updated `App.jsx` with persistent shell router.
  * Verified production build (`npm run build`).
* **2026-08-13 - Backend-Persisted First-Login Health Profile Integration:**
  * Created `UserProfile` model, `post_save` signal, `authentication.0001_initial` migration, `UserSerializer` profile fields, `OnboardingProfileView`, `urls.py`, `authService.js`, and `App.jsx`.

### Current Context

* **Project Title:** MediGuard — Smart Medicine Safety & Drug Interaction Assistant.
* **Current Working Branch:** `feature/frontend-ui`.
* **Key Code Locations:**
  * Dashboard Shell: [App.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/App.jsx)
  * Sidebar: [Sidebar.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/dashboard/Sidebar.jsx) & [Sidebar.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/dashboard/Sidebar.css)
  * Top Header: [Header.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/dashboard/Header.jsx) & [Header.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/dashboard/Header.css)
  * Dashboard Overview Page: [Dashboard.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Dashboard/Dashboard.jsx) & [Dashboard.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Dashboard/Dashboard.css)
* **Active Servers:**
  * Frontend: `http://localhost:5173/`
  * Backend: `http://127.0.0.1:8000/`

### Next Steps

1. Build medicine interaction checker UI in `src/pages/SafetyCheck/` and medicine cabinet CRUD in `src/pages/Medicines/`.
2. Connect backend REST API endpoints.

### Handoff

**Last completed:** Built complete MediGuard Dashboard layout, application shell, sidebar, top header, content cards, and sub-route navigation.
**Currently doing:** Ready for next feature step.
**Blocked by:** None
**Next action:** Await user command or proceed to next feature step.
