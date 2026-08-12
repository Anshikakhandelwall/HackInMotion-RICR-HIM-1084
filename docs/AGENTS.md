
# AGENTS.md

# MediGuard AI

## Project Overview

**Project Name:** MediGuard AI

**Hackathon:** Hack in Motion — RICR Bhopal

**Repository:** HackInMotion-RICR-HIM-1084

MediGuard AI is a smart medicine safety and drug interaction assistant designed for patients, caregivers, pharmacists, and other users who need an understandable way to identify potential medication-related risks.

The application focuses on helping users understand potential drug interactions, their severity, possible symptoms, supporting evidence, and appropriate next steps.

The product is a **health-information and safety-screening system**, not a diagnostic system and not a replacement for a qualified doctor or pharmacist.

---

# 1. Final Technology Stack

The following technology stack is considered **final** for this project.

## Frontend

* React
* Next.js
* Vite
* TypeScript
* Tailwind CSS
* shadcn/ui where appropriate

## Backend

* Python
* Django
* Django REST Framework

## Database

* PostgreSQL

## Database / Deployment Platform

* Supabase

PostgreSQL will be the project's database.

Supabase will be used to provide/manage the PostgreSQL database during deployment and production setup.

## AI

* LLM API
* RAG may be used where appropriate
* AI is an explanation/intelligence layer, not the primary source of truth for drug interaction decisions

## Drug and Medical Data

### Primary DDI Source

**DDInter 2.0**

DDInter 2.0 is the primary source for drug-drug interaction information.

It provides structured interaction information including severity and interaction-related details.

### Medicine Normalization

**RxNorm / RxNav API**

RxNorm/RxNav is used for standardized medicine identification and normalization.

Because the target audience includes Indian users, the system may also maintain an application-level medicine alias/brand normalization layer for Indian medicine names before or alongside standardized drug identification.

### Supporting Evidence

* openFDA
* DailyMed

These sources are intended primarily for supporting drug-label/evidence information rather than replacing DDInter as the primary DDI source.

---

# 2. Final Backend Application Architecture

The Django backend is organized around the following domain applications:

```text
backend/
└── apps/
    ├── medicines/
    ├── interactions/
    ├── patients/
    ├── ai/
    └── common/
```

Each application has a specific responsibility.

---

# 3. `medicines` App

## Purpose

The `medicines` application is responsible for medicine identity and normalization.

It answers:

> "What medicine is the user referring to?"

Responsibilities include:

* Medicine search
* Medicine identification
* Generic names
* Brand names
* Active ingredients
* Strength
* Units
* Drug identifiers
* Medicine aliases
* Indian brand-name normalization
* RxNorm/RxNav integration
* Canonical medicine representation

Example concept:

```text
Indian / user-provided medicine name
        ↓
Medicine alias / normalization
        ↓
Canonical medicine
        ↓
RxNorm identity where available
```

This application does **not** determine whether two medicines interact.

---

# 4. `interactions` App

## Purpose

The `interactions` application is the core medication-safety domain.

It is responsible for working with drug interaction information and interaction-related results.

Responsibilities include:

* Drug-drug interaction lookup
* Interaction data handling
* Medicine-pair handling
* Interaction severity
* Interaction mechanisms/details
* Symptoms or adverse effects associated with an interaction
* Interaction management/recommendation information
* Interaction evidence references
* Interaction-related API functionality
* Deterministic interaction processing

The primary DDI source is:

**DDInter 2.0**

The application should treat DDInter as the primary source for DDI information rather than asking an LLM to invent or determine interactions.

---

# 5. `patients` App

## Purpose

The `patients` application represents user/patient-specific medication and health context.

Potential responsibilities include:

* Patient/user profile information
* Medication profiles
* Saved medications
* Medication cabinet
* Relevant health conditions
* Allergies
* Other relevant patient context

The purpose of this application is to maintain context associated with a user.

It should not independently determine medical risk.

---

# 6. `ai` App

## Purpose

The `ai` application provides the artificial-intelligence layer of MediGuard.

Responsibilities may include:

* Patient-friendly explanations
* LLM API integration
* Prompt management
* RAG
* Medical information summarization
* Conversational interaction
* Explanation validation
* AI-assisted presentation of verified information

The AI layer must not be treated as the primary medical knowledge source.

The system should distinguish between:

```text
Verified medical/interaction information
```

and:

```text
AI-generated explanation
```

The AI layer should explain and simplify verified information rather than independently inventing drug interactions or medical conclusions.

---

# 7. `common` App

## Purpose

The `common` application contains genuinely shared backend infrastructure.

Potential responsibilities include:

* Shared exceptions
* Shared permissions
* Common utilities
* Shared pagination
* Other infrastructure used across multiple applications

Business logic should not be placed in `common` merely for convenience.

---

# 8. Final Data Source Architecture

The project uses the following finalized data-source responsibilities:

```text
DDInter 2.0
    ↓
Primary Drug-Drug Interaction Data


RxNorm / RxNav
    ↓
Medicine Normalization / Standardization


Indian Medicine Alias Layer
    ↓
Indian Brand → Generic / Canonical Medicine Mapping


openFDA
    ↓
Supporting Drug Information / Label Evidence


DailyMed
    ↓
Supporting Drug Label Information / Evidence
```

These sources have different responsibilities and should not be treated as interchangeable.

---

# 9. Risk Classification

DDInter's severity classification is the primary interaction severity reference.

The recognized DDInter severity categories include:

```text
Major
Moderate
Minor
Unknown
```

The application may map these source categories to the product's UI terminology.

The mapping must remain explicit and deterministic.

The LLM must not arbitrarily assign interaction severity.

---

# 10. Medical Safety Principles

MediGuard is a healthcare-related application, so medical safety and information integrity are priorities.

## No fabricated medical information

The system must never invent:

* Drug interactions
* Medical conditions
* Symptoms
* Drug mechanisms
* Contraindications
* Drug dosages
* Medical evidence
* Sources or citations

If information is unavailable or uncertain, the system should communicate that uncertainty.

## No LLM-based medical hallucination

The LLM must not be treated as an authoritative drug interaction database.

The system should preserve a clear distinction between verified data and generated explanations.

## No unsafe medication instructions

The application should not casually instruct users to:

* Stop prescribed medication
* Change prescribed dosage
* Double dosage
* Replace medication
* Start prescription medication without professional guidance

Safety-oriented guidance should encourage consultation with an appropriate healthcare professional where necessary.

## No absolute safety claims

The application must not imply:

> "No interaction found = completely safe."

Instead, appropriate wording should communicate that no relevant interaction was found in the available reference data.

---

# 11. DDInter Data and Licensing

DDInter 2.0 is the primary DDI source.

Its licensing and attribution requirements must be respected.

Current DDInter licensing information identifies the database as:

**CC BY-NC-SA 4.0**

The project must:

* Preserve appropriate attribution
* Respect the non-commercial terms
* Respect share-alike requirements where applicable
* Avoid claiming ownership of DDInter's underlying data
* Avoid assuming unrestricted commercial redistribution rights

The project should maintain source/attribution information in the documentation.

---

# 12. Evidence Philosophy

The system should distinguish between:

```text
Interaction source
```

and:

```text
Supporting evidence
```

DDInter is the primary DDI source.

openFDA and DailyMed provide supporting drug-label/evidence information.

Evidence should be represented clearly to users where appropriate.

The application should never fabricate a source or citation.

---

# 13. Indian User Consideration

The target audience includes Indian users.

Therefore, medicine identification should account for the fact that users may enter:

* Indian brand names
* Generic names
* Misspellings
* Different capitalization
* Strengths
* Informal medicine names

The architecture therefore supports an application-level normalization/alias layer in addition to RxNorm.

Conceptually:

```text
User Medicine Input
        ↓
Local / Indian Alias Recognition
        ↓
Canonical Medicine
        ↓
RxNorm / RxNav Standardization
```

The exact implementation and ordering of these components is intentionally not prescribed by this document.

---

# 14. Frontend Architecture

The frontend uses:

* React
* Next.js
* Vite
* TypeScript
* Tailwind CSS
* shadcn/ui where appropriate

The frontend is responsible for the user-facing experience, including concepts such as:

* Medicine input
* Medicine selection
* Medication list
* Interaction results
* Risk visualization
* Symptoms
* Safety recommendations
* Evidence display
* AI explanations
* Patient dashboard
* Medication profile

The frontend must not become the authoritative location for medical interaction logic.

Medical/business decisions belong to the backend/domain layer.

---

# 15. Backend Architecture

The backend uses:

* Python
* Django
* Django REST Framework

The backend is responsible for:

* API functionality
* Domain logic
* Medicine management
* Interaction management
* Patient context
* AI integration
* Data validation
* Evidence handling
* Database interaction

The backend should maintain clean separation between API handling, business/domain logic, data access, and AI functionality.

---

# 16. Database Architecture

The project uses:

**PostgreSQL**

PostgreSQL is the finalized relational database technology.

During deployment/production setup, PostgreSQL will be provided/managed through:

**Supabase**

The database architecture should remain compatible with standard PostgreSQL rather than relying unnecessarily on proprietary database behavior.

---

# 17. Project Structure

The intended high-level repository structure is:

```text
HackInMotion-RICR-HIM-1084/
│
├── backend/
│   ├── apps/
│   │   ├── common/
│   │   ├── medicines/
│   │   ├── interactions/
│   │   ├── patients/
│   │   └── ai/
│   │
│   ├── config/
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│
├── data/
│   ├── interactions/
│   ├── medicines/
│   └── sources/
│
├── docs/
│
├── scripts/
│
├── tests/
│
├── AGENTS.md
├── README.md
├── .env.example
└── .gitignore
```

This represents the intended project organization.

Individual files may be added, removed, or reorganized as implementation progresses.

---

# 18. Development Principles

When modifying the project:

1. Inspect the existing repository before making changes.
2. Preserve established architecture unless there is a strong technical reason to change it.
3. Do not create unnecessary Django applications.
4. Keep domain responsibilities separated.
5. Avoid unnecessary dependencies.
6. Avoid premature overengineering.
7. Keep medical interaction logic deterministic and evidence-based.
8. Keep AI functionality separated from safety-critical decision logic.
9. Never fabricate medical information or sources.
10. Never commit API keys or other secrets.
11. Use environment variables for credentials and configuration.
12. Keep APIs and data contracts explicit.
13. Write tests for important safety-critical logic.
14. Prefer small, understandable implementations over unnecessary abstraction.
15. Do not rewrite working components without a clear reason.
16. Treat source attribution and licensing as part of the implementation.

---

# 19. Scope of This AGENTS.md

This document defines:

* Project identity
* Product purpose
* Final technology stack
* Final Django application responsibilities
* Data-source responsibilities
* Medical safety principles
* Database technology
* High-level project structure
* Development principles

This document intentionally **does NOT define the application's internal connectivity or execution workflow**.

The exact workflow between:

* frontend
* backend
* database
* external drug APIs
* DDInter
* openFDA
* DailyMed
* AI
* RAG
* other services

will be determined by the project developer during implementation.

Agents must not assume that a particular workflow is mandatory merely because the components exist in this document.

Architectural decisions regarding connectivity, orchestration, request flow, caching, data synchronization, API composition, and deployment topology may evolve during development.

When implementing a feature, inspect the current repository and follow the currently implemented architecture rather than assuming a workflow from this document.

---

# 20. Primary Objective

Build a trustworthy, maintainable, and user-friendly medicine safety platform using:

```text
React
+
Next.js
+
Vite
+
TypeScript
+
Django
+
Django REST Framework
+
PostgreSQL
+
Supabase
+
DDInter 2.0
+
RxNorm / RxNav
+
openFDA
+
DailyMed
+
LLM / RAG
```

The product's central purpose is:

> **Turn reliable medication interaction data into understandable, safety-oriented information for users.**

The implementation should remain focused on correctness, clarity, safety, and a strong hackathon-ready user experience.

