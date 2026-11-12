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
python -m app.seed          # load sample categories and products
uvicorn app.main:app --reload
```

The API is served at http://localhost:8000 (interactive docs at `/docs`).

## Stripe (test mode)

1. Copy your test secret key from https://dashboard.stripe.com/test/apikeys into `STRIPE_SECRET_KEY`.
2. Forward webhooks locally with the [Stripe CLI](https://docs.stripe.com/stripe-cli):

   ```bash
   stripe listen --forward-to localhost:8000/api/stripe/webhook
   ```

   Put the printed `whsec_...` signing secret in `STRIPE_WEBHOOK_SECRET`.
3. Pay with test card `4242 4242 4242 4242`, any future expiry, any CVC.

`POST /api/checkout/session` creates a Checkout Session from the cart; the
`checkout.session.completed` webhook creates the paid `Order` record (idempotent per session).

## Admin API

Endpoints under `/api/admin/*` (product CRUD, order listing and status updates) require
`Authorization: Bearer $ADMIN_TOKEN`. If `ADMIN_TOKEN` is empty the admin API is disabled.

## Tests

```bash
pytest
```
