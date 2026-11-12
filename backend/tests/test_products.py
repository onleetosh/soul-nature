from app.seed import PRODUCTS


def test_list_categories(client, seeded):
    res = client.get("/api/categories")
    assert res.status_code == 200
    assert [c["slug"] for c in res.json()] == ["grooming", "personal-care", "fragrance", "wellness"]


def test_list_products(client, seeded):
    res = client.get("/api/products")
    body = res.json()
    assert res.status_code == 200
    assert body["total"] == len(PRODUCTS)
    assert body["items"][0]["category"]["slug"]


def test_filter_by_category(client, seeded):
    body = client.get("/api/products", params={"category": "fragrance"}).json()
    assert body["total"] == 3
    assert {p["category"]["slug"] for p in body["items"]} == {"fragrance"}


def test_filter_featured_and_search(client, seeded):
    featured = client.get("/api/products", params={"featured": True}).json()
    assert featured["total"] == sum(1 for p in PRODUCTS if p.get("is_featured"))
    search = client.get("/api/products", params={"q": "beard"}).json()
    assert search["total"] == 2


def test_sort_by_price(client, seeded):
    items = client.get("/api/products", params={"sort": "price_desc"}).json()["items"]
    prices = [p["price_cents"] for p in items]
    assert prices == sorted(prices, reverse=True)


def test_pagination(client, seeded):
    body = client.get("/api/products", params={"limit": 5, "offset": 5}).json()
    assert len(body["items"]) == 5
    assert body["total"] == len(PRODUCTS)


def test_get_product_by_id_and_slug(client, seeded):
    first = client.get("/api/products").json()["items"][0]
    by_id = client.get(f"/api/products/{first['id']}")
    by_slug = client.get(f"/api/products/slug/{first['slug']}")
    assert by_id.status_code == by_slug.status_code == 200
    assert by_id.json()["id"] == by_slug.json()["id"] == first["id"]


def test_product_not_found(client, seeded):
    assert client.get("/api/products/99999").status_code == 404
    assert client.get("/api/products/slug/nope").status_code == 404
