import hashlib
import hmac
import json
import time
from types import SimpleNamespace

import pytest
import stripe
from sqlmodel import select

from app.core.config import get_settings
from app.models import Order, OrderStatus, Product

WEBHOOK_SECRET = "whsec_test_secret"


@pytest.fixture(autouse=True)
def stripe_settings(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "stripe_secret_key", "sk_test_dummy")
    monkeypatch.setattr(settings, "stripe_webhook_secret", WEBHOOK_SECRET)


def _product(session, slug):
    return session.exec(select(Product).where(Product.slug == slug)).one()


def _signed(payload: dict) -> tuple[bytes, dict]:
    body = json.dumps(payload).encode()
    ts = int(time.time())
    sig = hmac.new(WEBHOOK_SECRET.encode(), f"{ts}.".encode() + body, hashlib.sha256).hexdigest()
    return body, {"Stripe-Signature": f"t={ts},v1={sig}", "Content-Type": "application/json"}


def _completed_event(session_id: str, cart: str, amount_total: int) -> dict:
    return {
        "id": "evt_1",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": session_id,
                "payment_status": "paid",
                "payment_intent": "pi_123",
                "amount_total": amount_total,
                "total_details": {"amount_shipping": 695},
                "metadata": {"cart": cart},
                "customer_details": {"email": "Buyer@Example.com", "name": "Jordan Buyer"},
                "collected_information": {
                    "shipping_details": {
                        "name": "Jordan Buyer",
                        "address": {
                            "line1": "1 Main St",
                            "line2": None,
                            "city": "Atlanta",
                            "state": "GA",
                            "postal_code": "30303",
                            "country": "US",
                        },
                    }
                },
            }
        },
    }


def test_create_checkout_session(client, seeded, monkeypatch):
    oil = _product(seeded, "cedar-sage-beard-oil")
    captured = {}

    def fake_create(**params):
        captured.update(params)
        return SimpleNamespace(id="cs_test_123", url="https://checkout.stripe.com/c/pay/cs_test_123")

    monkeypatch.setattr(stripe.checkout.Session, "create", fake_create)
    res = client.post(
        "/api/checkout/session",
        json={"email": "buyer@example.com", "items": [{"product_id": oil.id, "quantity": 2}]},
    )
    assert res.status_code == 200, res.text
    assert res.json() == {"id": "cs_test_123", "url": "https://checkout.stripe.com/c/pay/cs_test_123"}
    assert captured["mode"] == "payment"
    assert captured["metadata"] == {"cart": f"{oil.id}:2"}
    assert captured["line_items"][0]["price_data"]["unit_amount"] == 2400
    assert captured["customer_email"] == "buyer@example.com"
    assert "{CHECKOUT_SESSION_ID}" in captured["success_url"]


def test_checkout_rejects_bad_cart(client, seeded):
    sold_out = _product(seeded, "black-seed-oil-capsules")
    res = client.post("/api/checkout/session", json={"items": [{"product_id": sold_out.id, "quantity": 1}]})
    assert res.status_code == 400


def test_checkout_unconfigured(client, seeded, monkeypatch):
    monkeypatch.setattr(get_settings(), "stripe_secret_key", "")
    oil = _product(seeded, "cedar-sage-beard-oil")
    res = client.post("/api/checkout/session", json={"items": [{"product_id": oil.id, "quantity": 1}]})
    assert res.status_code == 503


def test_webhook_creates_paid_order_idempotently(client, seeded):
    oil = _product(seeded, "cedar-sage-beard-oil")
    starting_stock = oil.stock
    assert client.get("/api/checkout/session/cs_test_abc").json() == {
        "status": "processing",
        "order_number": None,
        "email": None,
    }

    body, headers = _signed(_completed_event("cs_test_abc", f"{oil.id}:2", 2 * 2400 + 695))
    for _ in range(2):
        res = client.post("/api/stripe/webhook", content=body, headers=headers)
        assert res.status_code == 200

    seeded.expire_all()
    orders = seeded.exec(select(Order)).all()
    assert len(orders) == 1
    order = orders[0]
    assert order.status == OrderStatus.paid
    assert order.email == "buyer@example.com"
    assert order.total_cents == 5495
    assert order.shipping_city == "Atlanta"
    assert order.items[0].quantity == 2
    assert seeded.get(Product, oil.id).stock == starting_stock - 2

    status = client.get("/api/checkout/session/cs_test_abc").json()
    assert status["status"] == "complete"
    assert status["order_number"] == order.order_number


def test_webhook_rejects_bad_signature(client, seeded):
    body, headers = _signed(_completed_event("cs_x", "1:1", 100))
    headers["Stripe-Signature"] = "t=1,v1=deadbeef"
    assert client.post("/api/stripe/webhook", content=body, headers=headers).status_code == 400


def test_webhook_ignores_unpaid_sessions(client, seeded):
    event = _completed_event("cs_unpaid", "1:1", 100)
    event["data"]["object"]["payment_status"] = "unpaid"
    body, headers = _signed(event)
    assert client.post("/api/stripe/webhook", content=body, headers=headers).status_code == 200
    assert seeded.exec(select(Order)).first() is None
