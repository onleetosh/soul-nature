from fastapi.testclient import TestClient
import pytest


def test_health_check(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_lists_seeded_products_with_category(client: TestClient) -> None:
    response = client.get("/api/v1/products")

    assert response.status_code == 200
    products = response.json()
    assert len(products) == 9
    assert products[0]["category"]["slug"] == "grooming"
    assert products[0]["price_cents"] == 2400


@pytest.mark.parametrize(
    ("category", "expected_count"),
    [("grooming", 3), ("fragrance", 3), ("wellness", 3), ("unknown", 0)],
)
def test_filters_products_by_category(
    client: TestClient,
    category: str,
    expected_count: int,
) -> None:
    response = client.get("/api/v1/products", params={"category": category})

    assert response.status_code == 200
    assert len(response.json()) == expected_count


def test_get_product_by_id(client: TestClient) -> None:
    response = client.get("/api/v1/products/1")

    assert response.status_code == 200
    assert response.json()["sku"] == "SON-GRM-001"


def test_missing_product_returns_404(client: TestClient) -> None:
    response = client.get("/api/v1/products/9999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Product not found"


def test_rejects_invalid_pagination(client: TestClient) -> None:
    response = client.get("/api/v1/products", params={"limit": 0})

    assert response.status_code == 422
