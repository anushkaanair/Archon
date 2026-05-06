FROM python:3.11-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Python deps (production only — no dev extras)
COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

# App code
COPY . .

# Port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health').raise_for_status()"

# Run — $PORT is injected by Railway (defaults to 8000 locally)
CMD uvicorn app.main:create_app --factory --host 0.0.0.0 --port ${PORT:-8000}
