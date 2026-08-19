# HealthAssist AI

**AI-Powered Telemedicine Assistance System for Disease Awareness and Healthcare Provider Connectivity.**

HealthAssist is a modern tele-health and clinical triage platform designed to empower patients with AI-driven symptom awareness, multi-LLM consensus verification, emergency safety checks, electronic medical health cards, and direct healthcare provider connectivity.

---

## 🏗️ Monorepo Architecture

```text
healthassist-ai/
├── frontend/                     # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/           # Reusable UI & common components (shadcn/ui style)
│   │   │   ├── ui/               # Button, Card, Badge, Input, Label
│   │   │   └── common/           # HealthStatusBadge, etc.
│   │   ├── pages/                # Application routes & views
│   │   │   ├── Login.tsx         # /login
│   │   │   ├── Signup.tsx        # /signup
│   │   │   ├── Dashboard.tsx     # /dashboard
│   │   │   ├── HealthProfile.tsx # /health-profile
│   │   │   ├── Assessment.tsx    # /assessment
│   │   │   ├── History.tsx       # /history
│   │   │   ├── HealthCard.tsx    # /health-card
│   │   │   ├── Providers.tsx     # /providers
│   │   │   ├── Profile.tsx       # /profile
│   │   │   └── NotFound.tsx      # 404
│   │   ├── layouts/              # MainLayout, AuthLayout
│   │   ├── hooks/                # useHealthCheck, custom hooks
│   │   ├── services/             # Axios API client & endpoints
│   │   ├── types/                # TypeScript interface definitions
│   │   └── utils/                # Styling (cn) and formatting helpers
│   ├── .env.example              # Frontend environment template
│   └── package.json
│
└── backend/                      # Python + FastAPI + SQLAlchemy + Pydantic
    ├── app/
    │   ├── api/                  # API routers & versioned endpoints (v1)
    │   │   └── v1/health.py      # GET /api/health
    │   ├── database/             # SQLAlchemy engine & session (SQLite/PostgreSQL)
    │   ├── models/               # SQLAlchemy ORM models (User, HealthProfile, Assessment)
    │   ├── schemas/              # Pydantic validation models
    │   ├── services/             # Business logic & health checks
    │   ├── ai/                   # Conversational AI triage agent placeholders
    │   ├── consensus/            # Multi-LLM consensus engine placeholders
    │   ├── safety/               # Clinical red-flag safety guard placeholders
    │   ├── utils/                # Pydantic Settings & logger
    │   └── main.py               # FastAPI application entrypoint
    ├── tests/                    # Pytest test suite
    ├── .env.example              # Backend environment template
    └── requirements.txt          # Python dependencies
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python**: 3.10+ (Python 3.13 supported)
- **Node.js**: 18+ (Node 24 supported)
- **npm**: 9+

---

### 2. Backend Setup (FastAPI)

```bash
cd backend

# 1. Create and activate virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup environment variables
cp .env.example .env

# 4. Start the FastAPI development server
uvicorn app.main:app --reload --port 8000
```

- **Interactive API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### 3. Frontend Setup (React + Vite)

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env

# 3. Start Vite dev server
npm run dev
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)

---

## 🔒 Security & Privacy Best Practices

- **Zero Client API Keys**: External LLM and clinical service API keys (`OPENAI_API_KEY`, `GEMINI_API_KEY`, etc.) are isolated strictly within the backend `backend/.env` and are **never** exposed to the frontend bundle.
- **CORS Configured**: Secure origin whitelisting in `backend/app/utils/config.py`.
- **Database Agnostic**: Defaults to SQLite for local development and smoothly swaps to PostgreSQL by updating `DATABASE_URL` in `backend/.env`.

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Build Validation
```bash
cd frontend
npm run build
```
