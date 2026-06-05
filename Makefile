.PHONY: migrate migrate-auto migrate-down dev test lint fmt typecheck

# ── Database ───────────────────────────────────────────────────────────────────
migrate:
	alembic upgrade head

migrate-auto:
	@read -p "Migration message: " msg; alembic revision --autogenerate -m "$$msg"

migrate-down:
	alembic downgrade -1

migrate-history:
	alembic history --verbose

# ── Development ────────────────────────────────────────────────────────────────
dev:
	uvicorn app.main:app --reload --port 8000

dev-stack:
	docker compose up -d postgres redis

# ── Code quality ───────────────────────────────────────────────────────────────
lint:
	ruff check app/ tests/

fmt:
	ruff format app/ tests/

typecheck:
	mypy app/ --ignore-missing-imports

# ── Testing ────────────────────────────────────────────────────────────────────
test:
	pytest tests/ -v --tb=short --cov=app --cov-report=term-missing

test-ci:
	pytest tests/ -v --tb=short --cov=app --cov-report=xml --cov-fail-under=50

# ── All checks ─────────────────────────────────────────────────────────────────
check: lint typecheck test
	@echo "✅ All checks passed"
