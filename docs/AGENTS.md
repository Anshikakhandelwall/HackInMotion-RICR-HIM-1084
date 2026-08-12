# Agent Working Memory (`AGENTS.md`)

This file serves as persistent working memory for AI coding agents working on the **MediGuard** project (`HackInMotion-RICR-HIM-1084`).

### Current State

* **What has been completed:**
  * Scaffolded React 19 + Vite 8 frontend in `frontend/` directory with scalable directory structure (`components/`, `pages/`, `services/`, `layouts/`, `routes/`, `styles/`, `assets/`).
  * Built complete **Register (Signup) Page** for MediGuard on branch `sign-up`.
  * **Strict Visual Correction (Light Theme):**
    * Removed all dark navy/slate backgrounds, blue gradients, blue glow effects, blue buttons, cyan, teal, and sky blue accents.
    * Replaced theme with pure dominant Light Theme (`#FFFDFC` background, `#FFFFFF` card surface) and a subtle warm red/rose accent (`#A6534B` primary button, `#B8665E` border/focus accent, `#FFF8F7` light surface tint, `#2B2524` charcoal text).
    * Updated [global.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/styles/global.css) tokens, [BrandLogo.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/common/BrandLogo.jsx) inline styles, [Input.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/common/Input.css), [Button.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/common/Button.css), [RegisterForm.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/auth/RegisterForm.css), [Signup.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Signup/Signup.css), and [App.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/App.jsx).
  * Preserved 100% of all existing registration form functionality, state management, real-time password checklist, show/hide password toggles, validation logic, loading states, error handling, and `authService.js` structure.
  * Verified grep search confirmed zero blue or dark-theme hex values remain in `frontend/src`.
  * Verified production build (`npm run build` — 0 errors, 400ms) and dev server execution (`npm run dev`).
* **What is currently working:**
  * MediGuard Register page with pure light theme, warm red-brown accents, real-time field validation, password checklist, show/hide password toggles, loading state, error alert banners, login link, and responsive layout.
* **What is partially implemented:**
  * Backend auth integration (prepared async `registerUser` function hook point in `src/services/auth/authService.js` awaiting backend REST endpoint connection).
  * Partner's Login page placeholder container in `App.jsx` (styled in Light Theme, left untouched for partner developer).
* **What is currently being worked on:** Maintaining detailed agent state memory in `docs/AGENTS.md`.

### Work History

* **2026-08-12 - Strict Visual Theme Correction (Light Theme & Warm Red/Rose):**
  * Removed all dark mode and blue/teal/cyan colors per strict visual correction specification.
  * Applied Light Theme design system: dominant `#FFFDFC` / `#FFFFFF` background, `#A6534B` primary CTA buttons (`#8F453F` hover), `#B8665E` focus ring / borders, `#FFF8F7` light surfaces, `#2B2524` charcoal primary text.
  * Updated `global.css`, `BrandLogo.jsx`, `Input.css`, `Button.css`, `RegisterForm.css`, `Signup.css`, and `App.jsx`.
  * Executed grep search to verify 0 blue/dark colors remain.
  * Tested `npm run build` (built in 400ms) and verified `npm run dev`.
* **2026-08-12 - MediGuard Register Page Implementation:**
  * Switched to working branch `sign-up`.
  * Built `BrandLogo.jsx`, `Input.jsx`, `Button.jsx`, `RegisterForm.jsx`, `Signup.jsx`, and `authService.js`.

### Current Context

* **Project Title:** MediGuard — Smart Medicine Safety & Drug Interaction Assistant.
* **Current Working Branch:** `sign-up`.
* **Key Code Locations:**
  * Global Design Tokens: [global.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/styles/global.css)
  * Signup Page: [Signup.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Signup/Signup.jsx) & [Signup.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/pages/Signup/Signup.css)
  * Register Form: [RegisterForm.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/auth/RegisterForm.jsx) & [RegisterForm.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/auth/RegisterForm.css)
  * Primary Button: [Button.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/common/Button.jsx) & [Button.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/common/Button.css)
  * Input Component: [Input.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/common/Input.jsx) & [Input.css](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/common/Input.css)
  * Brand Logo: [BrandLogo.jsx](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/components/common/BrandLogo.jsx)
  * Auth Service API Adapter: [authService.js](file:///c:/Users/lenovo/OneDrive/Desktop/newproject/HackInMotion-RICR-HIM-1084/frontend/src/services/auth/authService.js)
* **Visual Theme Rules:**
  * Dominant color: White (`#FFFDFC` / `#FFFFFF`).
  * Accent color: Muted Red-Brown (`#A6534B` CTA, `#B8665E` border/focus).
  * NO BLUE, NO CYAN, NO TEAL, NO DARK MODE.

### Next Steps

1. Commit and push `sign-up` branch changes to GitHub.
2. Connect `registerUser` in `src/services/auth/authService.js` to Django backend REST endpoint when backend views are ready.
3. Partner developer implements Login page in `src/pages/Login/`.
4. Implement React Router navigation in `src/routes/`.

### Handoff

**Last completed:** Strictly corrected Register page visual theme to pure Light Theme with muted red-brown accents while preserving 100% of existing functionality.
**Currently doing:** Completed visual correction; ready for commit/push or next task.
**Blocked by:** None
**Next action:** Commit changes or proceed to next feature step.
