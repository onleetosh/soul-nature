# Soul of Nature — Backend

FastAPI service powering the Soul of Nature storefront.

## Database

The API uses PostgreSQL via SQLModel/SQLAlchemy. Start a local database with Docker from the repo root:

```bash
docker compose up -d db
```

Tables are created automatically on startup (`SQLModel.metadata.create_all`).

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload
```

The API is served at http://localhost:8000 (interactive docs at `/docs`).

## Tests

```bash
pytest
```
