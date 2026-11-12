# Soul of Nature

Soul of Nature is a wellness and men's grooming brand focused on natural
personal-care, fragrance, and wellness products.

## Project structure

- `backend/` — FastAPI application, database models, seed data, and tests.
- `frontend/` — static storefront prototype. The planned Next.js frontend is
  not yet implemented.

The backend currently provides health, category, product, and order endpoints.
The static storefront is not yet connected to the API.

## Admin API

The admin API uses a single shared bearer token. Before starting the backend,
generate a long random token and set it in the server's environment:

```powershell
$env:ADMIN_API_TOKEN = .\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(32))"
```

Run this from `backend/`. Keep the token secret; do not commit it, put it in
frontend source code, or expose it in browser-delivered configuration.
All `/api/v1/admin` endpoints require an `Authorization: Bearer <token>`
header. An unset, non-ASCII, or shorter-than-32-character token disables the
admin API with a 503 response. Use a newly generated token whenever rotation is
needed. This shared-token mechanism is intended for development and trusted
administrators; it does not provide user accounts, individual access control,
rate limiting, or audit logging. Use HTTPS and a secure authentication
solution before production deployment.

- `GET /api/v1/admin/products` and `GET /api/v1/admin/products/{id}` include
  inactive products.
- `POST /api/v1/admin/products` creates a product; `PUT /api/v1/admin/products/{id}`
  replaces its fields. See `/docs` for the request schema. Category IDs come
  from `GET /api/v1/categories`.
- `DELETE /api/v1/admin/products/{id}` deactivates the product, preserving
  order history; set `is_active` to `true` via `PUT` to restore it.
- `GET /api/v1/admin/orders` lists orders, newest first, including their items.
  Both admin lists accept `limit` (1–100, default 20) and `offset` (default 0).

The test-mode checkout endpoint, `POST /api/v1/checkout/sessions`, accepts an
order's `email` and `order_number` and returns a Stripe-hosted `checkout_url`.
It uses the order's stored prices. Configure the following environment
variables before starting the backend:

```powershell
$env:STRIPE_SECRET_KEY = "sk_test_..."
$env:STRIPE_WEBHOOK_SECRET = "whsec_..."
$env:STRIPE_SUCCESS_URL = "http://localhost:3000/success"
$env:STRIPE_CANCEL_URL = "http://localhost:3000/cart"
```

Only test secret keys are accepted. Set the URLs to actual frontend routes when
the checkout UI exists; the static prototype does not provide them yet. A
checkout session is reused for retries. If it expires, the customer must create
a new order; an interrupted session creation may require manual reconciliation
after 23 hours to avoid accidentally charging twice.

Forward Stripe test events to `POST /api/v1/webhooks/stripe`, for example with
the Stripe CLI:

```powershell
stripe listen --forward-to localhost:8000/api/v1/webhooks/stripe
```

Set `STRIPE_WEBHOOK_SECRET` to the signing secret printed by the CLI and
restart the backend. A verified paid checkout marks the matching order `paid`;
the browser's success redirect does not confirm payment. These endpoints are
for development only: inventory reservation, shipping, tax, refunds, and
production payment handling are not implemented.

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
