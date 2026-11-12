# Soul of Nature

Soul of Nature is a wellness and men's grooming brand focused on natural
personal-care, fragrance, and wellness products.

## Project structure

- `backend/` — FastAPI application, database models, seed data, and tests.
- `frontend/` — static storefront prototype. The planned Next.js frontend is
  not yet implemented.

The backend currently provides health, category, product, and order endpoints.
The static storefront is not yet connected to the API.

## Backend setup

With Python 3.10 or newer, run the following from the repository root in
PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m app.seed
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`, with interactive documentation
at `http://127.0.0.1:8000/docs`. Run the tests from `backend/` with:

```powershell
.\.venv\Scripts\python.exe -m pytest
```

By default, the application uses `soul_of_nature.db` in the current working
directory, so run the backend commands from `backend/`. Set the `DATABASE_URL`
environment variable before starting the application to use another database.

If you previously ran the backend from `frontend/backend/`, its ignored local
database and virtual environment remain there. To retain that database, stop
the application and copy the database to `backend/soul_of_nature.db` before
running the seed or server commands; do not overwrite an existing database
without first checking it. Create a fresh virtual environment in `backend/`
instead of moving the old one.

## Frontend prototype

From the repository root:

```powershell
cd frontend
python -m http.server 3000
```

Open `http://localhost:3000` in a browser.
