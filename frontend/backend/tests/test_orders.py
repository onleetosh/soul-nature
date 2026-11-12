import pytest
from fastapi.testclient import TestClient


def test_create_order_uses_catalog_prices_and_snapshots_items(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/orders",
        json={
            "customer_email": "  CUSTOMER@example.com ",
            "items": [
                {"product_id": 1, "quantity": 2, "price_cents": 1},
                {"product_id": 4, "quantity": 1},
            ],
        },
    )

    assert response.status_code == 201
    order = response.json()
    assert order["order_number"].startswith("SON-")
    assert len(order["order_number"]) == 28
    assert order["customer_email"] == "customer@example.com"
    assert order["status"] == "pending"
    assert order["subtotal_cents"] == 11600
    assert order["total_cents"] == 11600
    assert [item["product_name"] for item in order["items"]] == [
        "Nourishing Beard Oil",
        "Stillwood Eau de Parfum",
    ]
    assert [item["unit_price_cents"] for item in order["items"]] == [
        2400,
        6800,
    ]


def test_order_lookup_requires_matching_email(
    client: TestClient,
) -> None:
    create_response = client.post(
        "/api/v1/orders",
        json={
            "customer_email": "customer@example.com",
            "items": [{"product_id": 1, "quantity": 1}],
        },
    )
    order_number = create_response.json()["order_number"]

    response = client.get(
        "/api/v1/orders/lookup",
        params={"email": "CUSTOMER@example.com", "order_number": order_number},
    )

    assert response.status_code == 200
    assert response.json()["order_number"] == order_number

    wrong_email_response = client.get(
        "/api/v1/orders/lookup",
        params={"email": "other@example.com", "order_number": order_number},
    )
    assert wrong_email_response.status_code == 404


def test_order_lookup_returns_404_for_unknown_order(
    client: TestClient,
) -> None:
    response = client.get(
        "/api/v1/orders/lookup",
        params={"email": "customer@example.com", "order_number": "SON-" + "0" * 24},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Order not found"


def test_order_requires_a_valid_email(client: TestClient) -> None:
    response = client.post(
        "/api/v1/orders",
        json={
            "customer_email": "not-an-email",
            "items": [{"product_id": 1, "quantity": 1}],
        },
    )

    assert response.status_code == 422


@pytest.mark.parametrize(
    ("items", "expected_status"),
    [
        ([{"product_id": 9999, "quantity": 1}], 404),
        ([{"product_id": 1, "quantity": 99}], 409),
        ([{"product_id": 1, "quantity": 0}], 422),
        (
            [
                {"product_id": 1, "quantity": 1},
                {"product_id": 1, "quantity": 2},
            ],
            422,
        ),
        ([], 422),
    ],
)
def test_order_rejects_invalid_items(
    client: TestClient,
    items: list[dict[str, int]],
    expected_status: int,
) -> None:
    response = client.post(
        "/api/v1/orders",
        json={"customer_email": "customer@example.com", "items": items},
    )

    assert response.status_code == expected_status
