# Soul of Nature — common development tasks. Run `make help` for a list.

# Windows venvs put executables in Scripts/ and `python3` is often just a Store alias.
ifeq ($(OS),Windows_NT)
PYTHON ?= python
VENV_BIN := .venv/Scripts
EXE := .exe
else
PYTHON ?= python3
VENV_BIN := .venv/bin
EXE :=
endif
VENV := backend/.venv
BIN := backend/$(VENV_BIN)
COMPOSE ?= docker compose

.DEFAULT_GOAL := help
.PHONY: help setup env db db-wait seed backend frontend dev stripe test lint check build stop clean

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

setup: env $(BIN)/uvicorn$(EXE) frontend/node_modules ## Install backend and frontend dependencies and create env files

env: backend/.env frontend/.env.local ## Create env files from the examples (never overwrites)

backend/.env:
	cp backend/.env.example $@

frontend/.env.local:
	cp frontend/.env.example $@

$(BIN)/uvicorn$(EXE): backend/requirements.txt backend/requirements-dev.txt
	$(PYTHON) -m venv $(VENV)
	$(BIN)/python -m pip install -r backend/requirements-dev.txt
	@touch $@

frontend/node_modules: frontend/package.json frontend/package-lock.json
	cd frontend && npm install
	@touch $@

db: ## Start PostgreSQL in Docker and wait until it accepts connections
	$(COMPOSE) up -d db
	@$(MAKE) --no-print-directory db-wait

db-wait:
	@echo "Waiting for PostgreSQL..."
	@until $(COMPOSE) exec -T db pg_isready -U soul -d soul_nature >/dev/null 2>&1; do sleep 1; done

seed: setup ## Load sample categories and products (idempotent)
	cd backend && $(VENV_BIN)/python -m app.seed

backend: setup ## Run the API at http://localhost:8000 (docs at /docs)
	cd backend && $(VENV_BIN)/uvicorn app.main:app --reload

frontend: setup ## Run the storefront at http://localhost:3000
	cd frontend && npm run dev

dev: setup ## Start the database, seed it, and run backend + frontend together
	@$(MAKE) --no-print-directory db
	@$(MAKE) --no-print-directory seed
	@$(MAKE) --no-print-directory -j2 backend frontend

stripe: ## Forward Stripe test webhooks to the local API (requires the Stripe CLI)
	stripe listen --forward-to localhost:8000/api/stripe/webhook

test: setup ## Run backend tests
	cd backend && $(VENV_BIN)/pytest

lint: setup ## Lint backend (ruff) and frontend (eslint + tsc)
	cd backend && $(VENV_BIN)/ruff check .
	cd frontend && npm run lint && npx tsc --noEmit

build: setup ## Production build of the frontend
	cd frontend && npm run build

check: test lint build ## Run every check

stop: ## Stop the database container
	$(COMPOSE) down

clean: ## Remove installed dependencies and build output (keeps env files and data)
	rm -rf $(VENV) frontend/node_modules frontend/.next
