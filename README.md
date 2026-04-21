# Archon — AI Systems Design Engine

<div align="center">
  <img src="https://img.shields.io/badge/Status-Beta-7F77DD?style=flat-square&labelColor=0d0b18" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&labelColor=0d0b18" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=flat-square&labelColor=0d0b18" />
  <img src="https://img.shields.io/badge/Database-SQLite%20%2F%20PostgreSQL-003B57?style=flat-square&labelColor=0d0b18" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square&labelColor=0d0b18" />
</div>

---

**Archon** is a production-ready AI infrastructure design engine. Describe your product in plain English and receive a fully scored architecture blueprint — complete with model recommendations, cost estimates, P95 latency projections, a Mermaid.js architecture diagram, and RAGAs quality evaluation.

Built for engineering teams that need to move fast without making expensive infrastructure decisions based on guesswork.

---

## Features

| Capability | Description |
|---|---|
| **Semantic Task Analysis** | Auto-detects RAG, code generation, classification, and translation tasks from natural language descriptions |
| **Model Strategy Engine** | Scores and ranks LLMs (GPT-4o, Claude, Gemini, Llama, Mistral, etc.) on cost, latency, quality, and task fit |
| **Architecture Diagrams** | Generates Mermaid.js graphs with modular nodes for ingestion, retrieval, generation, and evaluation flows |
| **Cost & Latency Projections** | Extrapolated monthly run rates and P95 latency benchmarks against real request volumes |
| **Hybrid RAG Vectorization** | Dense embeddings + BM25 sparse indexing unified under CrossEncoder reranking |
| **RAGAs Evaluation** | Faithfulness, answer relevancy, context precision, and recall — with confidence flags below threshold |
| **Blueprint History** | Full persistence, pagination, and JSON export of all generated blueprints |
| **Real-time Analytics** | Dashboard with live stats from the database — no hardcoded data |

---

## Architecture

```
archon/
├── app/
│   ├── api/v1/          # FastAPI routers (architect, blueprints, dashboard, models)
│   ├── db/              # SQLAlchemy async sessions + models
│   ├── schemas/         # Pydantic request/response schemas
│   ├── services/        # Pipeline stages (reasoning, model strategy, cost/latency sim, eval)
│   └── main.py          # App factory, CORS, lifespan
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components (MermaidDiagram, ScoreGauge, etc.)
│   │   ├── context/     # Auth context (API-key based)
│   │   ├── pages/       # Route pages (Home, Login, Dashboard, Builder, Analytics, Settings)
│   │   └── App.tsx      # Router configuration
│   └── vite.config.ts   # Dev proxy → backend port 8000
├── alembic/             # DB migration scripts
└── pyproject.toml       # Python dependencies
```

### 8-Stage Pipeline (`POST /v1/architect`)

```
Input Text
  ↓ [1] Semantic Analysis  — detect tasks + confidence
  ↓ [2] RAG Context Query  — retrieve relevant model benchmarks
  ↓ [3] Model Scoring      — rank models on 4 dimensions
  ↓ [4] Architecture Gen   — produce Mermaid diagram
  ↓ [5] Cost Estimation    — monthly USD per request volume
  ↓ [6] Latency Estimation — P50/P95 per model tier
  ↓ [7] RAGAs Evaluation   — faithfulness, relevancy, precision, recall
  ↓ [8] Explanation Gen    — plain-English rationale + citations
  ↓ Persist to DB → Return blueprint JSON
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11 · FastAPI · SQLAlchemy (async) · Alembic |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion |
| Database | SQLite (dev) · PostgreSQL (prod) |
| AI/ML | Anthropic Claude · OpenAI GPT-4o · sentence-transformers |
| Evaluation | RAGAs framework |
| Diagrams | Mermaid.js |
| Auth | API-key based (Bearer token) |

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- An Anthropic or OpenAI API key (optional — fallback mode works without one)

### 1. Backend

```bash
# Clone
git clone https://github.com/your-username/archon.git
cd archon

# Create virtualenv
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# Install
pip install -e .

# Configure
cp .env.example .env
# Edit .env — add OPENAI_API_KEY or ANTHROPIC_API_KEY

# Initialise DB
python init_db.py

# Run
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

API docs available at **http://localhost:8000/docs**

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Optional | Enables GPT-4o for explanation + RAGAs eval |
| `ANTHROPIC_API_KEY` | Optional | Alternative to OpenAI for explanations |
| `DATABASE_URL` | No | Postgres URL for production (default: SQLite) |
| `API_KEY_HASH_SECRET` | No | Secret for API key hashing |
| `CORS_ORIGINS` | No | Comma-separated list of allowed origins |

---

## Deployment

### Render (Backend)

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repository
3. Set:
   - **Root Directory**: `/` (repo root)
   - **Build Command**: `pip install -e .`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables in the Render dashboard
5. Optionally add a **PostgreSQL** database from Render's add-ons

### Vercel (Frontend)

1. Push the repo to GitHub
2. Import the project at [vercel.com](https://vercel.com)
3. Set:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   - `VITE_API_URL` = `https://your-archon-backend.onrender.com`

### Railway (Full Stack, Easiest)

Deploy both services from one dashboard at [railway.app](https://railway.app) — Railway auto-detects Python and Node.js from the repo root.

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/v1/architect` | POST | Full 8-stage pipeline — returns complete blueprint |
| `/v1/blueprints` | GET | Paginated blueprint history |
| `/v1/blueprints/{id}` | GET | Full blueprint detail |
| `/v1/dashboard/stats` | GET | Aggregate metrics (counts, costs, avg scores) |
| `/v1/models` | GET | List all models in registry |
| `/v1/analyze` | POST | Standalone semantic task detection |
| `/v1/recommend` | POST | Standalone model scoring |
| `/v1/estimate` | POST | Cost + latency estimation only |
| `/v1/explain` | POST | LLM explanation generation |

All endpoints require `Authorization: Bearer <api-key>` header.

---

## Cost Estimate

Archon uses external LLM APIs **only for Stage 7 (explanation generation)**. All other stages run locally with no API cost.

| Usage | Blueprints/month | Approximate LLM Cost |
|---|---|---|
| Dev / Demo | 50 | ~$0.60 |
| Small Team | 500 | ~$6 |
| Production | 5,000 | ~$60 |

Using Claude Sonnet (~$0.012/blueprint) or GPT-4o (~$0.017/blueprint).

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">
  <sub>Built with precision by the Archon team · Not affiliated with any LLM provider</sub>
</div>
