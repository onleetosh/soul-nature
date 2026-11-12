import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def admin_headers(monkeypatch: pytest.MonkeyPatch) -> dict[str, str]:
    token = "a" * 32
    monkeypatch.setenv("ADMIN_API_TOKEN", token)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def product_data() -> dict[str, object]:
    return {
        "sku": "NEW-001",
        "name": "New product",
        "slug": "new-product",
        "description": "A new product.",
        "price_cents": 1500,
        "image_url": None,
        "stock_quantity": 5,
        "category_id": 1,
        "is_active": True,
    }


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("GET", "/api/v1/admin/products"),
        ("GET", "/api/v1/admin/products/1"),
        ("POST", "/api/v1/admin/products"),
        ("PUT", "/api/v1/admin/products/1"),
        ("DELETE", "/api/v1/admin/products/1"),
        ("GET", "/api/v1/admin/orders"),
    ],
)
def test_admin_routes_require_authentication(
    client: TestClient,
    admin_headers: dict[str, str],
    product_data: dict[str, object],
    method: str,
    path: str,
) -> None:
    response = client.request(method, path, json=product_data)
    assert response.status_code == 401
    response = client.request(
        method, path, json=product_data, headers={"Authorization": "Bearer wrong"}
    )
    assert response.status_code == 401


def test_product_lifecycle_preserves_orders_and_public_visibility(
    client: TestClient, admin_headers: dict[str, str], product_data: dict[str, object]
) -> None:
    created = client.post("/api/v1/admin/products", headers=admin_headers, json=product_data)
    assert created.status_code == 201
    product = created.json()
    product_id = product["id"]
    assert product["category"]["id"] == 1
    assert product["is_active"] is True
    assert client.get(f"/api/v1/products/{product_id}").status_code == 200
    order = client.post(
        "/api/v1/orders",
        json={"customer_email": "user@example.com", "items": [{"product_id": product_id, "quantity": 1}]},
    ).json()

    updated_data = {**product_data, "name": "Updated", "price_cents": 2500, "category_id": 2}
    updated = client.put(
        f"/api/v1/admin/products/{product_id}", headers=admin_headers, json=updated_data
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Updated"
    assert updated.json()["category"]["id"] == 2
    assert client.get(f"/api/v1/products/{product_id}").json()["price_cents"] == 2500

    assert client.delete(f"/api/v1/admin/products/{product_id}", headers=admin_headers).status_code == 204
    assert client.get(f"/api/v1/products/{product_id}").status_code == 404
    archived = client.get(f"/api/v1/admin/products/{product_id}", headers=admin_headers)
    assert archived.status_code == 200
    assert archived.json()["is_active"] is False
    assert any(p["id"] == product_id for p in client.get("/api/v1/admin/products", headers=admin_headers).json())

    lookup = client.get(
        "/api/v1/orders/lookup",
        params={"email": "user@example.com", "order_number": order["order_number"]},
    )
    assert lookup.json()["items"][0]["product_name"] == "New product"
    assert lookup.json()["items"][0]["unit_price_cents"] == 1500

    assert client.put(
        f"/api/v1/admin/products/{product_id}", headers=admin_headers, json=updated_data
    ).json()["is_active"] is True
    assert client.get(f"/api/v1/products/{product_id}").status_code == 200


@pytest.mark.parametrize(
    ("field", "value", "expected"),
    [
        ("sku", "SON-GRM-001", 409),
        ("slug", "nourishing-beard-oil", 409),
        ("category_id", 999, 422),
        ("price_cents", -1, 422),
        ("price_cents", 2_147_483_648, 422),
        ("stock_quantity", -1, 422),
        ("category_id", 2**64, 422),
        ("name", "   ", 422),
        ("slug", "Bad Slug", 422),
        ("sku", "a" * 51, 422),
        ("unexpected", True, 422),
    ],
)
def test_invalid_product_data(
    client: TestClient, admin_headers: dict[str, str], product_data: dict[str, object],
    field: str, value: object, expected: int,
) -> None:
    response = client.post(
        "/api/v1/admin/products", headers=admin_headers, json={**product_data, field: value}
    )
    assert response.status_code == expected


def test_update_rejects_duplicate_and_missing_product(
    client: TestClient, admin_headers: dict[str, str], product_data: dict[str, object]
) -> None:
    response = client.put(
        "/api/v1/admin/products/1", headers=admin_headers,
        json={**product_data, "sku": "SON-GRM-002"},
    )
    assert response.status_code == 409
    assert client.get("/api/v1/products/1").json()["sku"] == "SON-GRM-001"
    assert client.put("/api/v1/admin/products/9999", headers=admin_headers, json=product_data).status_code == 404
    assert client.delete("/api/v1/admin/products/9999", headers=admin_headers).status_code == 404


def test_admin_orders_are_paginated_and_include_items(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    for email in ("first@example.com", "second@example.com"):
        assert client.post(
            "/api/v1/orders",
            json={
                "customer_email": email,
                "items": [
                    {"product_id": 1, "quantity": 1},
                    {"product_id": 2, "quantity": 1},
                ],
            },
        ).status_code == 201
    response = client.get("/api/v1/admin/orders", headers=admin_headers, params={"limit": 1, "offset": 1})
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["customer_email"] == "first@example.com"
    assert response.json()[0]["items"][0]["product_name"] == "Nourishing Beard Oil"
    assert len(response.json()[0]["items"]) == 2
    assert client.get("/api/v1/admin/orders", headers=admin_headers, params={"limit": 101}).status_code == 422
    assert client.get("/api/v1/admin/products", headers=admin_headers, params={"offset": -1}).status_code == 422


def test_admin_cors_preflight(client: TestClient) -> None:
    response = client.options(
        "/api/v1/admin/products/1",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "PUT",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert response.status_code == 200
    assert "PUT" in response.headers["access-control-allow-methods"]
