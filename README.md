<div align="center">

# ⚡ Archon

**API-first AI Systems Design Engine**

*Describe your product idea → Get a complete AI architecture blueprint.*

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/framework-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

---

## What is Archon?

Archon is an API that accepts a **natural language product idea** and returns a **complete AI stack blueprint** — models, architecture, cost estimates, latency projections, and evaluation scores.

```
"A legal document Q&A bot for law firms"
        ↓ Archon Pipeline
✅ Detected tasks: RAG, chatbot, translation
✅ Model recommendations: GPT-4o, Claude 3.5, MiniLM
✅ Architecture diagram (Mermaid)
✅ Monthly cost: $247.50 (cited sources)
✅ P95 latency: 1.2s (benchmarked)
✅ RAGAs eval: 0.89 composite score
✅ Plain-English explanation with tradeoffs
```

## Pipeline

| Stage | Description |
|-------|-------------|
| **1. Semantic Analysis** | sentence-transformers detect AI tasks (RAG, image gen, code gen, etc.) |
| **2. RAG Retrieval** | Hybrid search: Qdrant dense + BM25 sparse → CrossEncoder re-rank |
| **3. Model Strategy** | Score models on cost, latency, quality, task fit (weighted composite) |
| **4. Architecture** | Generate workflow graph → JSON + Mermaid diagram |
| **5. Cost + Latency** | Estimate from live pricing — every number cites its source |
| **6. RAGAs Eval** | Faithfulness, relevancy, precision, recall → confidence flag |
| **7. Explanation** | LLM-generated reasoning with tradeoffs and alternatives |

## Quick Start

```bash
# 1. Clone and setup
cd archon
cp .env.example .env  # Edit with your API keys

# 2. Start infrastructure
docker compose up -d

# 3. Install dependencies
pip install -e ".[dev]"

# 4. Run migrations
alembic upgrade head

# 5. Start the server
uvicorn app.main:create_app --factory --reload
```

## API Endpoints

All endpoints are under `/v1/` and require Bearer token auth.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/analyze` | Detect AI tasks from text |
| `POST` | `/v1/recommend` | Get ranked model recommendations |
| `POST` | `/v1/architect` | Generate full blueprint (async/sync) |
| `POST` | `/v1/estimate` | Cost + latency estimates with citations |
| `POST` | `/v1/explain` | Plain-English architecture explanation |
| `GET`  | `/v1/models` | List model registry (cached 1hr) |
| `GET`  | `/health` | Service health check |

## SDKs

### Python

```python
from archon import ArchonClient

client = ArchonClient(api_key="arch_xxx")
result = client.architect("A legal Q&A bot with citation tracking")

print(result.architecture_diagram)
print(f"Monthly cost: ${result.cost_estimate['total_monthly_usd']:.2f}")
print(f"Confidence: {result.confidence_flag}")
```

### TypeScript

```typescript
import { ArchonClient } from '@archon/sdk';

const client = new ArchonClient({ apiKey: 'arch_xxx' });
const result = await client.architect('An AI code review tool');

console.log(result.architectureDiagram);
console.log(`Monthly cost: $${result.costEstimate?.total_monthly_usd}`);
```

## Architecture

```
archon/
├── app/
│   ├── api/v1/          # Route handlers (analyze, recommend, architect, ...)
│   ├── cache/           # Redis client + JSON helpers
│   ├── db/
│   │   ├── models/      # 6 SQLAlchemy ORM models
│   │   ├── base.py      # Declarative base (UUID PK, timestamps, soft-delete)
│   │   └── session.py   # Async engine + session factory
│   ├── observability/   # Langfuse tracing
│   ├── rag/             # Embedder, chunker, BM25, reranker, knowledge base
│   ├── schemas/         # Pydantic request/response models
│   ├── services/        # Business logic (analyzer, strategy, generator, ...)
│   ├── workers/         # Celery tasks for async pipeline
│   ├── config.py        # Pydantic settings
│   ├── dependencies.py  # Auth + DI
│   ├── main.py          # App factory
│   └── middleware.py    # Request ID + rate limiting
├── sdk/
│   ├── python/          # Python SDK (sync + async)
│   └── typescript/      # TypeScript SDK
├── tests/               # pytest suite
├── docker-compose.yml   # PostgreSQL, Redis, Qdrant, Langfuse
└── pyproject.toml       # Dependencies
```

## Rules & Constraints

- Every recommendation is **evaluated with RAGAs** — no unscored output
- Model pricing is **fetched live** — never hardcoded
- Every cost/latency estimate **cites its benchmark source**
- RAGAs composite < 0.7 triggers a **low confidence flag**
- Rate limiting: **100 req/min** (free) / **1000 req/min** (pro)
- API keys are **hashed with SHA-256** — raw keys never stored
- All routes are **fully async** with Pydantic validation
- Failed Celery tasks use **exponential backoff** (max 3 retries)

## License

MIT
