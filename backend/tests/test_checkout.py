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


def _signed(payload: dict, ts: int | None = None) -> tuple[bytes, dict]:
    body = json.dumps(payload).encode()
    ts = int(time.time()) if ts is None else ts
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
    assert captured["metadata"] == {"cart_0": f"{oil.id}:2:{oil.price_cents}"}
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


def test_webhook_rejects_stale_signature(client, seeded):
    body, headers = _signed(_completed_event("cs_old", "1:1", 100), ts=int(time.time()) - 3600)
    assert client.post("/api/stripe/webhook", content=body, headers=headers).status_code == 400


def test_webhook_ignores_unpaid_sessions(client, seeded):
    event = _completed_event("cs_unpaid", "1:1", 100)
    event["data"]["object"]["payment_status"] = "unpaid"
    body, headers = _signed(event)
    assert client.post("/api/stripe/webhook", content=body, headers=headers).status_code == 200
    assert seeded.exec(select(Order)).first() is None


def test_webhook_uses_charged_price_and_survives_product_changes(client, seeded):
    oil = _product(seeded, "cedar-sage-beard-oil")
    balm = _product(seeded, "shea-butter-beard-balm")
    oil_id, balm_id = oil.id, balm.id
    oil.price_cents = 9999
    seeded.add(oil)
    seeded.delete(balm)
    seeded.commit()

    event = _completed_event("cs_changed", f"{oil_id}:1:2400,{balm_id}:2:1800", 2400 + 3600 + 695)
    body, headers = _signed(event)
    assert client.post("/api/stripe/webhook", content=body, headers=headers).status_code == 200

    seeded.expire_all()
    order = seeded.exec(select(Order).where(Order.stripe_session_id == "cs_changed")).one()
    assert order.subtotal_cents == 2400 + 3600
    prices = {item.product_name: (item.product_id, item.unit_price_cents) for item in order.items}
    assert prices[oil.name] == (oil_id, 2400)
    assert prices[f"Product #{balm_id}"] == (None, 1800)


def test_webhook_fulfills_no_payment_required_sessions(client, seeded):
    oil = _product(seeded, "cedar-sage-beard-oil")
    event = _completed_event("cs_free", f"{oil.id}:1:0", 0)
    event["data"]["object"]["payment_status"] = "no_payment_required"
    body, headers = _signed(event)
    assert client.post("/api/stripe/webhook", content=body, headers=headers).status_code == 200
    assert seeded.exec(select(Order).where(Order.stripe_session_id == "cs_free")).first() is not None


def test_webhook_reads_chunked_cart_metadata(client, seeded):
    oil = _product(seeded, "cedar-sage-beard-oil")
    event = _completed_event("cs_chunked", "", 2 * 2400 + 695)
    event["data"]["object"]["metadata"] = {"cart_1": "2:2400", "cart_0": f"{oil.id}:"}
    body, headers = _signed(event)
    assert client.post("/api/stripe/webhook", content=body, headers=headers).status_code == 200
    order = seeded.exec(select(Order).where(Order.stripe_session_id == "cs_chunked")).one()
    assert order.items[0].quantity == 2


def test_checkout_rejects_combined_quantity_over_limit(client, seeded):
    oil = _product(seeded, "cedar-sage-beard-oil")
    res = client.post(
        "/api/checkout/session",
        json={"items": [{"product_id": oil.id, "quantity": 20}, {"product_id": oil.id, "quantity": 1}]},
    )
    assert res.status_code == 400
