# Archon — AI Systems Design Engine

<div align="center">

### [Open the live app →](https://archon-one-kappa.vercel.app)

<br/>

<img src="https://img.shields.io/badge/Try%20it%20live-archon--one--kappa.vercel.app-5B00E8?style=for-the-badge&labelColor=0d0b18" alt="Live demo" />

<br/>

<img src="https://img.shields.io/badge/Status-Live%20Beta-059669?style=flat-square&labelColor=0d0b18" />
<img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&labelColor=0d0b18" />
<img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat-square&labelColor=0d0b18" />
<img src="https://img.shields.io/badge/Database-PostgreSQL-003B57?style=flat-square&labelColor=0d0b18" />
<img src="https://img.shields.io/badge/LLM-Gemini%202.5%20Flash-4285F4?style=flat-square&labelColor=0d0b18" />
<img src="https://img.shields.io/badge/License-MIT-green?style=flat-square&labelColor=0d0b18" />

</div>

---

## Try it now

Open **[archon-one-kappa.vercel.app](https://archon-one-kappa.vercel.app)**, sign in with Google or GitHub, and:

1. Describe an AI product in plain English in the **Builder**
2. Get back a complete architecture blueprint with model ranking, monthly cost, p95 latency, and a quality evaluation
3. Open the **Playground** to drag and drop pipeline nodes, configure each with real models, and run them against live Gemini for real output
4. Watch the **Dashboard** auto-pull live RSS news from OpenAI, Anthropic, DeepMind, HuggingFace and MIT every 30 minutes

No setup, no API keys to bring — the demo runs on the maintainer's Gemini quota.

---

## What it does

**Archon turns a plain-English product description into a production-ready AI architecture.** Instead of spending 2–4 weeks researching models, comparing pricing pages, prototyping pipelines, and debating tradeoffs with your team, you describe what you want and get back:

- **Detected AI tasks** (RAG, vision, code generation, conversational AI, agents…) inferred via embeddings
- **Ranked model recommendations** — 47 real models scored on cost, latency, quality, task fit
- **Monthly cost projection** at your traffic volume, with per-model breakdowns and pricing-source citations
- **End-to-end p95 latency** estimate broken down by pipeline stage
- **Architecture diagram** as an interactive node graph you can click into
- **RAGAs quality evaluation** (faithfulness, answer relevancy, context precision, context recall)
- **Plain-English explanation** of why this stack and what tradeoffs were made
- **Live constraint controls** — drag a slider for requests/month or max latency, the page recomputes the entire blueprint

---

## Who it's for

| User | Use case |
|------|----------|
| **Solo founders / PMs** | Scoping a new AI feature without weeks of model research |
| **Engineering leads** | Cost-planning before adding LLM to an existing product |
| **AI architects** | Comparing tradeoffs across models in one place |
| **Compliance teams** | Checking which models meet GDPR / HIPAA / SOC2 |
| **Educators / students** | Learning how production AI systems are designed |

---

## Tech stack

**Frontend** — React 19 · TypeScript · Vite · Tailwind CSS · framer-motion · react-router · lucide-react · Mermaid.js · html2canvas + jsPDF for report export

**Backend** — Python 3.11 · FastAPI · async SQLAlchemy 2 · asyncpg · Alembic · Redis (optional) · Celery (optional) · structlog · python-jose

**AI / ML** — Google Gemini 2.5 Flash (text generation) · text-embedding-004 (semantic task detection) · pgvector for hybrid retrieval · BM25 fallback · RAGAs for quality evaluation · Anthropic + OpenAI SDKs ready as alternative providers

**Auth** — Google + GitHub OAuth 2.0 · HS256 JWT in httpOnly cookies · 30-day session with 7-day grace refresh

**Hosting** — Vercel (frontend) · Render (backend + PostgreSQL) · GitHub (source)

---

## Architecture

```
USER PROMPT  →  POST /v1/architect
              ↓
   STAGE 1   Semantic task detection
              cosine similarity vs 13 task anchors
              keyword fallback when embedder unavailable
              ↓
   STAGE 2   Persist query (audit trail)
              ↓
   STAGE 3   Model scoring
              47 models from registry
              multi-criteria weighted score (cost · latency · quality · fit)
              ↓
   STAGE 4   Architecture generation
              build typed DAG (input → retriever → llm → output)
              emit Mermaid + JSON
              ↓
   STAGE 5   Cost + latency estimation
              tokens × calls × $/M token with pricing citations
              ↓
   STAGE 6   RAGAs quality evaluation (4s timeout)
              ↓
   STAGE 7   LLM explanation generation (5s timeout)
              ↓
   STAGE 8   Persist blueprint  →  return JSON
```

Every stage is independently fault-tolerant — a failure in one stage degrades gracefully rather than failing the whole pipeline.

---

## API surface

`GET /health` — liveness probe

`POST /v1/architect` — full blueprint generation pipeline
`GET /v1/blueprints` · `GET /v1/blueprints/:id` — list and read previous blueprints
`POST /v1/playground/run` — execute a visual pipeline graph with real Gemini calls
`GET /v1/news` · `POST /v1/news/refresh` — live AI industry news from 5 RSS feeds
`GET /v1/dashboard/stats` — aggregate metrics for the signed-in user
`GET /v1/models` — full model registry (47 models with pricing, latency, ELO)
`GET /v1/user/me` · `PATCH /v1/user/me` — profile read and update

`GET /auth/google` · `GET /auth/github` · `GET /auth/me` · `POST /auth/refresh` · `POST /auth/logout` — OAuth + session

Full spec at `https://archon-backend-8bhe.onrender.com/docs` (interactive OpenAPI UI).

---

## Run it locally

```bash
git clone https://github.com/anushkaanair/Archon.git
cd Archon

# Backend
python -m venv .venv
.venv/Scripts/activate            # or source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt

# Environment
cp .env.example .env
# Edit .env — set at least one of GOOGLE_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY
# (see docs/OAUTH_SETUP.md for adding Google/GitHub sign-in)

# Start backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                       # opens http://localhost:5174
```

Backend serves at `http://localhost:8000`, OpenAPI docs at `/docs`, and the frontend auto-proxies API calls.

---

## Deploy your own

The repo includes a `render.yaml` blueprint that spins up the backend service plus a PostgreSQL database on **[Render](https://render.com)** with one click. The frontend is a Vite SPA — deploy to **[Vercel](https://vercel.com)** by importing the repo with `frontend` as the Root Directory.

Full setup walkthrough: `docs/OAUTH_SETUP.md`

---

## License

MIT — see [`LICENSE`](LICENSE)

---

<div align="center">

Made by [@anushkaanair](https://github.com/anushkaanair) · Powered by Gemini, FastAPI, and a lot of late-night refactoring

**[Try the live demo →](https://archon-one-kappa.vercel.app)**

</div>
