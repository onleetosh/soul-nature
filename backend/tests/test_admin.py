import pytest
from sqlmodel import select

from app.core.config import get_settings
from app.models import Category, Product

TOKEN = "admin-test-token"
AUTH = {"Authorization": f"Bearer {TOKEN}"}


@pytest.fixture(autouse=True)
def admin_token(monkeypatch):
    monkeypatch.setattr(get_settings(), "admin_token", TOKEN)


def test_requires_token(client, seeded):
    assert client.get("/api/admin/products").status_code == 401
    assert client.get("/api/admin/products", headers={"Authorization": "Bearer wrong"}).status_code == 401
    assert client.get("/api/admin/orders").status_code == 401


def test_disabled_without_configured_token(client, seeded, monkeypatch):
    monkeypatch.setattr(get_settings(), "admin_token", "")
    assert client.get("/api/admin/products", headers=AUTH).status_code == 503


def test_product_crud(client, seeded):
    category = seeded.exec(select(Category).where(Category.slug == "grooming")).one()
    payload = {
        "name": "Hair Growth Oil",
        "slug": "hair-growth-oil",
        "price_cents": 2100,
        "stock": 10,
        "category_id": category.id,
    }
    created = client.post("/api/admin/products", json=payload, headers=AUTH)
    assert created.status_code == 201, created.text
    product_id = created.json()["id"]

    assert client.post("/api/admin/products", json=payload, headers=AUTH).status_code == 409

    updated = client.patch(
        f"/api/admin/products/{product_id}", json={"price_cents": 1900, "is_active": False}, headers=AUTH
    )
    assert updated.status_code == 200
    assert updated.json()["price_cents"] == 1900
    assert client.get(f"/api/products/{product_id}").status_code == 404
    assert any(p["id"] == product_id for p in client.get("/api/admin/products", headers=AUTH).json())

    assert client.delete(f"/api/admin/products/{product_id}", headers=AUTH).status_code == 204
    assert client.get(f"/api/admin/products/{product_id}", headers=AUTH).status_code == 404


def test_create_product_validates_category(client, seeded):
    res = client.post(
        "/api/admin/products",
        json={"name": "X", "slug": "x", "price_cents": 100, "category_id": 999},
        headers=AUTH,
    )
    assert res.status_code == 400


def test_list_and_update_orders(client, seeded):
    oil = seeded.exec(select(Product).where(Product.slug == "cedar-sage-beard-oil")).one()
    for email in ("one@example.com", "two@example.com"):
        client.post("/api/orders", json={"email": email, "items": [{"product_id": oil.id, "quantity": 1}]})

    listing = client.get("/api/admin/orders", headers=AUTH).json()
    assert listing["total"] == 2
    filtered = client.get("/api/admin/orders", params={"q": "two@"}, headers=AUTH).json()
    assert filtered["total"] == 1

    order_id = filtered["items"][0]["id"]
    res = client.patch(f"/api/admin/orders/{order_id}", json={"status": "shipped"}, headers=AUTH)
    assert res.status_code == 200
    assert res.json()["status"] == "shipped"
    shipped = client.get("/api/admin/orders", params={"status": "shipped"}, headers=AUTH).json()
    assert shipped["total"] == 1
