from types import SimpleNamespace
from unittest.mock import Mock

import pytest
import stripe
from fastapi.testclient import TestClient


@pytest.fixture
def stripe_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_example")
    monkeypatch.setenv("STRIPE_SUCCESS_URL", "http://localhost:3000/success")
    monkeypatch.setenv("STRIPE_CANCEL_URL", "http://localhost:3000/cart")


def create_order(client: TestClient) -> str:
    response = client.post(
        "/api/v1/orders",
        json={
            "customer_email": "customer@example.com",
            "items": [{"product_id": 1, "quantity": 2}],
        },
    )
    assert response.status_code == 201
    return response.json()["order_number"]


def test_checkout_uses_order_prices_and_reuses_session(
    client: TestClient, monkeypatch: pytest.MonkeyPatch, stripe_settings: None
) -> None:
    checkout = SimpleNamespace(
        id="cs_test_123", url="https://checkout.stripe.com/test", status="open",
        livemode=False,
    )
    create = Mock(return_value=checkout)
    retrieve = Mock(return_value=checkout)
    monkeypatch.setattr(stripe.checkout.Session, "create", create)
    monkeypatch.setattr(stripe.checkout.Session, "retrieve", retrieve)
    order_number = create_order(client)
    payload = {"email": "CUSTOMER@example.com", "order_number": order_number}

    response = client.post("/api/v1/checkout/sessions", json=payload)
    retry = client.post("/api/v1/checkout/sessions", json=payload)

    assert response.status_code == 200
    assert response.json() == {"checkout_url": checkout.url}
    assert retry.json() == response.json()
    create.assert_called_once()
    retrieve.assert_called_once_with("cs_test_123", api_key="sk_test_example")
    arguments = create.call_args.kwargs
    assert arguments["idempotency_key"] == f"checkout-{order_number}"
    assert arguments["client_reference_id"] == order_number
    assert arguments["payment_method_types"] == ["card"]
    assert arguments["line_items"] == [{
        "price_data": {
            "currency": "usd",
            "product_data": {"name": "Nourishing Beard Oil"},
            "unit_amount": 2400,
        },
        "quantity": 2,
    }]


def test_checkout_requires_matching_email(
    client: TestClient, stripe_settings: None
) -> None:
    response = client.post(
        "/api/v1/checkout/sessions",
        json={"email": "other@example.com", "order_number": create_order(client)},
    )
    assert response.status_code == 404


def test_checkout_requires_test_mode_configuration(
    client: TestClient, monkeypatch: pytest.MonkeyPatch, stripe_settings: None
) -> None:
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_live_example")
    response = client.post(
        "/api/v1/checkout/sessions",
        json={"email": "customer@example.com", "order_number": create_order(client)},
    )
    assert response.status_code == 503


def test_checkout_reports_stripe_errors_and_retries_with_same_key(
    client: TestClient, monkeypatch: pytest.MonkeyPatch, stripe_settings: None
) -> None:
    checkout = SimpleNamespace(
        id="cs_test_123", url="https://checkout.stripe.com/test", status="open",
        livemode=False,
    )
    create = Mock(side_effect=[stripe.error.APIConnectionError("offline"), checkout])
    monkeypatch.setattr(stripe.checkout.Session, "create", create)
    payload = {"email": "customer@example.com", "order_number": create_order(client)}

    assert client.post("/api/v1/checkout/sessions", json=payload).status_code == 502
    assert client.post("/api/v1/checkout/sessions", json=payload).status_code == 200
    assert create.call_args_list[0].kwargs == create.call_args_list[1].kwargs


def test_expired_checkout_is_not_recreated(
    client: TestClient, monkeypatch: pytest.MonkeyPatch, stripe_settings: None
) -> None:
    checkout = SimpleNamespace(id="cs_test_123", url=None, status="expired", livemode=False)
    create = Mock(return_value=checkout)
    monkeypatch.setattr(stripe.checkout.Session, "create", create)
    monkeypatch.setattr(stripe.checkout.Session, "retrieve", Mock(return_value=checkout))
    payload = {"email": "customer@example.com", "order_number": create_order(client)}
    assert client.post("/api/v1/checkout/sessions", json=payload).status_code == 409
    assert client.post("/api/v1/checkout/sessions", json=payload).status_code == 409
    create.assert_called_once()
