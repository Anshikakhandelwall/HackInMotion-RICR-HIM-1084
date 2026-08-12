# MediGuard Frontend Structure

This document outlines the architecture and directory organization of the MediGuard React + Vite frontend application.

## Directory Overview

```text
src/
├── assets/         # Static media assets (images, icons, SVGs)
├── components/     # UI components organized by domain feature
│   ├── common/     # Generic, reusable UI widgets (buttons, inputs, modals, cards)
│   ├── auth/       # Authentication-related UI components (login forms, signup forms)
│   ├── dashboard/  # Dashboard-specific UI widgets and overview widgets
│   ├── medicines/  # Medicine management components (lists, entry forms, detail cards)
│   ├── interactions/ # Drug interaction check components and alert visualizers
│   └── history/    # Check history and audit log presentation components
├── pages/          # Full-page views corresponding to top-level routes
│   ├── Landing/    # Public landing and product introduction page
│   ├── Login/      # User authentication login view
│   ├── Signup/     # User account registration view
│   ├── Dashboard/  # Authenticated main overview page
│   ├── Medicines/  # User medicine cabinet management page
│   ├── SafetyCheck/ # Drug interaction checker page
│   ├── History/    # Safety check & medicine history log page
│   └── Profile/    # User settings and profile management page
├── layouts/        # Page wrapper layouts (e.g., AuthLayout, MainDashboardLayout, Navbar, Sidebar)
├── services/       # External service adapters and network APIs
│   ├── api/        # Axios/Fetch HTTP client instances, endpoint definitions, and backend API calls
│   └── auth/       # Authentication service tokens, session management, and auth API integrations
├── hooks/          # Custom reusable React hooks (e.g., useAuth, useMedicines, useDebounce)
├── context/        # React Context providers for global state (AuthContext, ThemeContext, NotificationContext)
├── utils/          # Pure helper functions, formatting utilities, and constants
├── routes/         # Router configuration, path constants, protected route wrappers
└── styles/         # Global style sheets, CSS tokens, and theme definitions
```

## 1. Purpose of Each Major Folder

* `assets/`: Stores raw static files like images, SVGs, logos, and fonts.
* `components/`: Modular UI units grouped by feature area (`auth`, `dashboard`, `medicines`, `interactions`, `history`).
* `pages/`: Container components representing entire application screens/routes.
* `layouts/`: Master page layouts (including navigation headers, footers, sidebars) wrapping `pages/`.
* `services/`: Encapsulates all data fetching, HTTP request handlers, and third-party integrations.
* `hooks/`: Reusable custom React hooks managing stateful business logic separate from UI rendering.
* `context/`: Application-wide context providers for global cross-cutting concerns.
* `utils/`: Side-effect-free utility functions (date formatting, string helpers, validation rules).
* `routes/`: Centralized route declarations, route constants, and navigation guard components.
* `styles/`: Global styles, reset rules, design system variables, and theme definitions.

## 2. Shared Code Locations

* **Shared UI Components:** `src/components/common/` (Buttons, Modals, Inputs, Loaders).
* **Shared Logic & Helpers:** `src/utils/` (formatting, validators) and `src/hooks/` (reusable logic).
* **Shared Global State:** `src/context/` (User sessions, global alerts, app state).
* **Shared Layouts:** `src/layouts/` (Navbar, Sidebar, Footer, Container layouts).

## 3. Where API Integration Will Go

* **Base API Client & Endpoints:** `src/services/api/` will contain the HTTP client instances, interceptors, base URLs, and medicine/safety check API methods.
* **Authentication API:** `src/services/auth/` will handle token storage, session management, login/logout API calls, and headers.

## 4. Where Routing Will Be Handled

* Centralized route definitions and page mapping will live inside `src/routes/`.
* `App.jsx` will mount the router configuration created in `src/routes/`.
