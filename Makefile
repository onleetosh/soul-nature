ifeq ($(OS),Windows_NT)
SHELL := cmd.exe
PYTHON ?= py -3
VENV_PYTHON := .venv\Scripts\python.exe
else
PYTHON ?= python3
VENV_PYTHON := .venv/bin/python
endif

API_PORT ?= 8000
FRONTEND_PORT ?= 3000

.DEFAULT_GOAL := help
.PHONY: help setup frontend-setup seed api frontend test frontend-check

help:
	@echo make setup    - Install backend and frontend dependencies
	@echo make frontend-setup - Install frontend dependencies
	@echo make seed     - Add sample products to the backend database
	@echo make api      - Start the API on port $(API_PORT)
	@echo make frontend - Start the storefront on port $(FRONTEND_PORT)
	@echo make test     - Run backend tests
	@echo make frontend-check - Build and type-check the frontend

setup:
	cd backend && $(PYTHON) -m venv .venv
	cd backend && $(VENV_PYTHON) -m pip install -r requirements.txt
	cd frontend && npm ci

frontend-setup:
	cd frontend && npm ci

seed:
	cd backend && $(VENV_PYTHON) -m app.seed

api:
	cd backend && $(VENV_PYTHON) -m uvicorn app.main:app --reload --port $(API_PORT)

frontend:
	cd frontend && npm run dev -- --hostname 127.0.0.1 --port $(FRONTEND_PORT)

test:
	cd backend && $(VENV_PYTHON) -m pytest

frontend-check:
	cd frontend && npm run build
