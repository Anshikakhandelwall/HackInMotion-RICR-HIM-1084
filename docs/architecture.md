#PROJECT ARCHITECTURE
HackInMotion-RICR-HIM-1084/
│
├── backend/
│   │
│   ├── apps/
│   │   │
│   │   ├── common/
│   │   │
│   │   ├── medicines/
│   │   │   ├── migrations/
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── services.py
│   │   │   ├── validators.py
│   │   │   ├── urls.py
│   │   │   ├── views.py
│   │   │   └── tests.py
│   │   │
│   │   ├── interactions/
│   │   │   ├── migrations/
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── services.py
│   │   │   ├── engine.py
│   │   │   ├── rules.py
│   │   │   ├── urls.py
│   │   │   ├── views.py
│   │   │   └── tests.py
│   │   │
│   │   ├── patients/
│   │   │   ├── migrations/
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── services.py
│   │   │   ├── urls.py
│   │   │   ├── views.py
│   │   │   └── tests.py
│   │   │
│   │   └── ai/
│   │       ├── migrations/
│   │       ├── __init__.py
│   │       ├── admin.py
│   │       ├── apps.py
│   │       ├── services.py
│   │       ├── prompts.py
│   │       ├── validators.py
│   │       ├── urls.py
│   │       ├── views.py
│   │       └── tests.py
│   │
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   │
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
│
├── frontend/
│   │
│   ├── public/
│   │
│   ├── src/
│   │   │
│   │   ├── main.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Landing/
│   │   │   ├── Login/
│   │   │   ├── Signup/
│   │   │   ├── Dashboard/
│   │   │   ├── Medicines/
│   │   │   ├── SafetyCheck/
│   │   │   ├── History/
│   │   │   └── Profile/
│   │   │
│   │   ├── routes/
│   │   │   └── ...
│   │   │
│   │   ├── services/
│   │   │   ├── api/
│   │   │   │   ├── client.js
│   │   │   │   ├── medicines.js
│   │   │   │   ├── interactions.js
│   │   │   │   ├── patients.js
│   │   │   │   └── ai.js
│   │   │   │
│   │   │   └── auth/
│   │   │       ├── authService.js
│   │   │       └── ...
│   │   │
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── medicines/
│   │   │   ├── interactions/
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   └── ai/
│   │   │
│   │   ├── styles/
│   │   │   └── global.css
│   │   │
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   ├── validators.js
│   │   │   └── helpers.js
│   │   │
│   │   └── ...
│   │
│   ├── FRONTEND_STRUCTURE.md
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── .env.example
│
│
├── data/
│   │
│   ├── interactions/
│   │   ├── drug_interactions.json
│   │   └── high_risk_interactions.json
│   │
│   ├── medicines/
│   │   ├── medicine_aliases.json
│   │   └── indian_brands.json
│   │
│   └── sources/
│       ├── sources.json
│       └── attribution.md
│
│
├── scripts/
│   ├── seed_database.py
│   ├── import_medicines.py
│   ├── import_interactions.py
│   └── validate_data.py
│
│
├── tests/
│   ├── integration/
│   └── fixtures/
│
│
├── docs/
│   ├── AGENTS.md
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   ├── sources.md
│   ├── ai-safety.md
│   └── deployment.md
│
│
├── .env.example
├── .gitignore
├── README.md
└── LICENSE