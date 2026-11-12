from sqlmodel import select

from app.models import Product


def _product(session, slug):
    return session.exec(select(Product).where(Product.slug == slug)).one()


def test_create_and_lookup_order(client, seeded):
    oil = _product(seeded, "cedar-sage-beard-oil")
    bar = _product(seeded, "charcoal-eucalyptus-body-bar")
    res = client.post(
        "/api/orders",
        json={
            "email": "Customer@Example.com",
            "customer_name": "Marcus",
            "items": [
                {"product_id": oil.id, "quantity": 1},
                {"product_id": bar.id, "quantity": 2},
                {"product_id": oil.id, "quantity": 1},
            ],
        },
    )
    assert res.status_code == 201, res.text
    order = res.json()
    assert order["status"] == "pending"
    assert order["order_number"].startswith("SON-")
    assert order["subtotal_cents"] == 2 * 2400 + 2 * 1000
    assert order["shipping_cents"] == 695
    assert order["total_cents"] == order["subtotal_cents"] + 695
    assert len(order["items"]) == 2

    found = client.get(
        "/api/orders/lookup",
        params={"email": "customer@example.com", "order_number": order["order_number"].lower()},
    )
    assert found.status_code == 200
    assert found.json()["id"] == order["id"]


def test_free_shipping_over_threshold(client, seeded):
    parfum = _product(seeded, "roots-eau-de-parfum")
    order = client.post(
        "/api/orders",
        json={"email": "a@example.com", "items": [{"product_id": parfum.id, "quantity": 2}]},
    ).json()
    assert order["shipping_cents"] == 0


def test_lookup_requires_matching_email(client, seeded):
    oil = _product(seeded, "cedar-sage-beard-oil")
    order = client.post(
        "/api/orders", json={"email": "a@example.com", "items": [{"product_id": oil.id, "quantity": 1}]}
    ).json()
    res = client.get("/api/orders/lookup", params={"email": "b@example.com", "order_number": order["order_number"]})
    assert res.status_code == 404


def test_rejects_out_of_stock_and_unknown_products(client, seeded):
    sold_out = _product(seeded, "black-seed-oil-capsules")
    res = client.post(
        "/api/orders", json={"email": "a@example.com", "items": [{"product_id": sold_out.id, "quantity": 1}]}
    )
    assert res.status_code == 400
    res = client.post("/api/orders", json={"email": "a@example.com", "items": [{"product_id": 9999, "quantity": 1}]})
    assert res.status_code == 400


def test_validates_payload(client, seeded):
    assert client.post("/api/orders", json={"email": "not-an-email", "items": []}).status_code == 422
