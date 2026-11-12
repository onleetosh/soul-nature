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
.PHONY: help setup seed api frontend test

help:
	@echo make setup    - Create backend virtual environment and install dependencies
	@echo make seed     - Add sample products to the backend database
	@echo make api      - Start the API on port $(API_PORT)
	@echo make frontend - Start the storefront on port $(FRONTEND_PORT)
	@echo make test     - Run backend tests

setup:
	cd backend && $(PYTHON) -m venv .venv
	cd backend && $(VENV_PYTHON) -m pip install -r requirements.txt

seed:
	cd backend && $(VENV_PYTHON) -m app.seed

api:
	cd backend && $(VENV_PYTHON) -m uvicorn app.main:app --reload --port $(API_PORT)

frontend:
	cd frontend && $(PYTHON) -m http.server $(FRONTEND_PORT) --bind 127.0.0.1

test:
	cd backend && $(VENV_PYTHON) -m pytest
