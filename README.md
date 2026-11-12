# Soul of Nature

E-commerce storefront for **Soul of Nature**, a Black-owned wellness and men's grooming brand selling natural grooming, personal-care, fragrance, and wellness products.

- **Backend:** FastAPI + SQLModel (SQLAlchemy) on PostgreSQL
- **Frontend:** Next.js (App Router) + Tailwind CSS v4 + shadcn/ui, mobile-first
- **Payments:** Stripe Checkout (test mode) — guest checkout, webhook creates paid orders
- **Admin:** token-protected product CRUD and order management at `/admin`

## Repository layout

| Path                 | Description                                                       |
| -------------------- | ----------------------------------------------------------------- |
| `backend/`           | FastAPI REST API ([backend/README.md](backend/README.md))         |
| `frontend/`          | Next.js storefront ([frontend/README.md](frontend/README.md))     |
| `docker-compose.yml` | Local PostgreSQL 16                                               |

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker (for PostgreSQL) or a local PostgreSQL 14+
- A [Stripe](https://dashboard.stripe.com/register) account (test mode) and the [Stripe CLI](https://docs.stripe.com/stripe-cli) for webhooks

## Quick start

With `make` (macOS/Linux, or Windows with Git Bash/WSL and GNU Make, e.g. `winget install ezwinports.make`; Docker Desktop must be running):

```bash
git clone https://github.com/onleetosh/soul-nature.git
cd soul-nature
make dev      # installs deps, creates env files, starts Postgres, seeds, runs backend + frontend
```

Then open http://localhost:3000 (API at http://localhost:8000/docs). Press Ctrl+C to stop the servers
and `make stop` to stop the database. Run `make help` for all targets (`setup`, `db`, `seed`, `backend`,
`frontend`, `stripe`, `test`, `lint`, `build`, `check`, `stop`, `clean`). `make db` uses port 5432, so
stop any other PostgreSQL on that port first.

Or step by step:

```bash
git clone https://github.com/onleetosh/soul-nature.git
cd soul-nature

# 1. Database
docker compose up -d db

# 2. Backend (http://localhost:8000, docs at /docs)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env          # fill in STRIPE_* and ADMIN_TOKEN
python -m app.seed            # sample categories + 16 products
uvicorn app.main:app --reload

# 3. Stripe webhooks (separate terminal) — copy the whsec_... into backend/.env
stripe listen --forward-to localhost:8000/api/stripe/webhook

# 4. Frontend (http://localhost:3000)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Pay with Stripe's test card `4242 4242 4242 4242`, any future expiry date, and any CVC.

## Environment variables

All secrets are read from environment variables (or the git-ignored `.env` / `.env.local` files). Never commit real keys.

### Backend (`backend/.env`)

| Variable                        | Description                                                            | Default                                                    |
| ------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`                  | SQLAlchemy URL (psycopg 3 driver)                                      | `postgresql+psycopg://soul:soul@localhost:5432/soul_nature` |
| `CORS_ORIGINS`                  | JSON list of allowed browser origins                                   | `["http://localhost:3000"]`                                |
| `FRONTEND_URL`                  | Storefront URL used for Stripe success/cancel redirects                | `http://localhost:3000`                                    |
| `STRIPE_SECRET_KEY`             | Stripe **test** secret key (`sk_test_...`)                             | — (checkout disabled when empty)                           |
| `STRIPE_WEBHOOK_SECRET`         | Webhook signing secret (`whsec_...`)                                   | — (webhook disabled when empty)                            |
| `ADMIN_TOKEN`                   | Bearer token for `/api/admin/*` and the `/admin` UI                    | — (admin disabled when empty)                              |
| `CURRENCY`                      | ISO currency code                                                      | `usd`                                                      |
| `SHIPPING_FLAT_CENTS`           | Flat shipping rate                                                     | `695`                                                      |
| `FREE_SHIPPING_THRESHOLD_CENTS` | Subtotal at which shipping becomes free                                | `7500`                                                     |

### Frontend (`frontend/.env.local`)

| Variable              | Description                                                        | Default                 |
| --------------------- | ------------------------------------------------------------------ | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Backend URL used by the browser and server components              | `http://localhost:8000` |
| `API_URL`             | Optional server-only override (e.g. an internal Docker hostname)   | —                       |

## How checkout works

1. The cart lives in the browser (`localStorage`); no account is needed.
2. `/checkout` collects an email and calls `POST /api/checkout/session`. The backend re-prices the cart from the database, checks stock, and creates a Stripe Checkout Session (shipping address + payment collected by Stripe).
3. After payment Stripe sends `checkout.session.completed` to `POST /api/stripe/webhook`. The signature is verified and a `paid` `Order` with its `OrderItem`s is created (idempotent per session) and stock is decremented.
4. `/checkout/success` polls `GET /api/checkout/session/{id}` until the order exists, then shows the order number.
5. Customers can check progress any time at `/orders` with their email + order number.

## Admin

Set `ADMIN_TOKEN` in `backend/.env`, restart the API, then visit http://localhost:3000/admin and paste the token. From there you can create, edit, hide, and delete products, and filter orders and update their status (`pending → paid → shipped → delivered`, or `cancelled`). The token is kept in `sessionStorage` for the browser tab only.

## Pages

| Route                            | Description                                   |
| -------------------------------- | --------------------------------------------- |
| `/`                              | Home: hero, categories, featured products     |
| `/products`                      | Catalog with category filter, search, sort    |
| `/products/[slug]`               | Product detail + add to cart                  |
| `/cart`                          | Cart with quantity controls                   |
| `/checkout`, `/checkout/success` | Stripe Checkout and confirmation              |
| `/orders`                        | Order status lookup                           |
| `/about`, `/contact`, `/shipping-returns` | Brand story and policies             |
| `/admin/products`, `/admin/orders` | Admin dashboard                             |

## Development

```bash
make check    # or, by hand:

# Backend
cd backend && pytest && ruff check .

# Frontend
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```

## Deploying to Render

`render.yaml` is a [Render Blueprint](https://render.com/docs/blueprint-spec) that creates a free PostgreSQL database, the API (`soul-nature-api`) and the storefront (`soul-nature-web`).

1. In the Render dashboard choose **New → Blueprint**, connect this repository and pick the branch to deploy.
2. When prompted, enter `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (leave them empty to deploy without payments).
3. After the first deploy, find the generated `ADMIN_TOKEN` under the API service's **Environment** tab.
4. For payments, add a Stripe webhook endpoint at `https://soul-nature-api.onrender.com/api/stripe/webhook` and put its signing secret in `STRIPE_WEBHOOK_SECRET`.

The API seeds missing sample products on every start. If Render gives either service a different URL, update `CORS_ORIGINS` and `FRONTEND_URL` on the API and `NEXT_PUBLIC_API_URL` on the storefront, then redeploy the storefront. Free services sleep when idle, so the first request can take up to a minute.

## License

[MIT](LICENSE)
