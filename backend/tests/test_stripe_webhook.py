import hashlib
import hmac
import json
import time
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
import stripe
from fastapi.testclient import TestClient

from test_checkout import create_order


@pytest.fixture
def configured_checkout(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_example")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_example")
    monkeypatch.setenv("STRIPE_SUCCESS_URL", "http://localhost:3000/success")
    monkeypatch.setenv("STRIPE_CANCEL_URL", "http://localhost:3000/cart")
    monkeypatch.setattr(
        stripe.checkout.Session,
        "create",
        Mock(return_value=SimpleNamespace(
            id="cs_test_123", url="https://checkout.stripe.com/test",
            status="open", livemode=False,
        )),
    )


def send_event(
    client: TestClient,
    order_number: str,
    *,
    event_type: str = "checkout.session.completed",
    **checkout_overrides: object,
):
    checkout = {
        "id": "cs_test_123",
        "object": "checkout.session",
        "livemode": False,
        "mode": "payment",
        "payment_status": "paid",
        "client_reference_id": order_number,
        "currency": "usd",
        "amount_total": 4800,
    }
    checkout.update(checkout_overrides)
    body = json.dumps({
        "id": "evt_test_123",
        "object": "event",
        "type": event_type,
        "livemode": False,
        "data": {"object": checkout},
    }).encode()
    timestamp = int(time.time())
    signature = hmac.new(
        b"whsec_example", str(timestamp).encode() + b"." + body, hashlib.sha256
    ).hexdigest()
    return client.post(
        "/api/v1/webhooks/stripe",
        content=body,
        headers={"Stripe-Signature": f"t={timestamp},v1={signature}"},
    )


def start_checkout(client: TestClient) -> str:
    order_number = create_order(client)
    response = client.post(
        "/api/v1/checkout/sessions",
        json={"email": "customer@example.com", "order_number": order_number},
    )
    assert response.status_code == 200
    return order_number


def order_status(client: TestClient, order_number: str) -> str:
    response = client.get(
        "/api/v1/orders/lookup",
        params={"email": "customer@example.com", "order_number": order_number},
    )
    assert response.status_code == 200
    return response.json()["status"]


def test_signed_payment_marks_order_paid_and_duplicate_is_safe(
    client: TestClient, configured_checkout: None
) -> None:
    order_number = start_checkout(client)
    assert send_event(client, order_number).status_code == 200
    assert send_event(client, order_number).status_code == 200
    assert order_status(client, order_number) == "paid"
    response = client.post(
        "/api/v1/checkout/sessions",
        json={"email": "customer@example.com", "order_number": order_number},
    )
    assert response.status_code == 409


def test_webhook_rejects_bad_signatures(
    client: TestClient, configured_checkout: None
) -> None:
    order_number = start_checkout(client)
    response = client.post(
        "/api/v1/webhooks/stripe",
        content=b"{}",
        headers={"Stripe-Signature": f"t={int(time.time())},v1=invalid"},
    )
    assert response.status_code == 400
    assert order_status(client, order_number) == "pending"


@pytest.mark.parametrize(
    "overrides",
    [
        {"id": "cs_test_other"},
        {"amount_total": 1},
        {"currency": "eur"},
        {"livemode": True},
        {"mode": "subscription"},
    ],
)
def test_webhook_rejects_mismatched_session(
    client: TestClient, configured_checkout: None, overrides: dict[str, object]
) -> None:
    order_number = start_checkout(client)
    assert send_event(client, order_number, **overrides).status_code == 400
    assert order_status(client, order_number) == "pending"


def test_unpaid_checkout_is_not_marked_paid(
    client: TestClient, configured_checkout: None
) -> None:
    order_number = start_checkout(client)
    assert send_event(client, order_number, payment_status="unpaid").status_code == 200
    assert order_status(client, order_number) == "pending"
    assert send_event(
        client, order_number, event_type="checkout.session.async_payment_succeeded"
    ).status_code == 200
    assert order_status(client, order_number) == "paid"


def test_webhook_recovers_when_checkout_response_was_lost(
    client: TestClient, monkeypatch: pytest.MonkeyPatch, configured_checkout: None
) -> None:
    monkeypatch.setattr(
        stripe.checkout.Session,
        "create",
        Mock(side_effect=stripe.error.APIConnectionError("response lost")),
    )
    order_number = create_order(client)
    response = client.post(
        "/api/v1/checkout/sessions",
        json={"email": "customer@example.com", "order_number": order_number},
    )
    assert response.status_code == 502
    assert send_event(client, order_number).status_code == 200
    assert order_status(client, order_number) == "paid"


def test_webhook_requires_signing_configuration(
    client: TestClient, monkeypatch: pytest.MonkeyPatch, configured_checkout: None
) -> None:
    monkeypatch.delenv("STRIPE_WEBHOOK_SECRET")
    response = client.post("/api/v1/webhooks/stripe", content=b"{}")
    assert response.status_code == 503
