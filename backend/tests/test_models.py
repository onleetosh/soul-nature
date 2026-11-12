from sqlmodel import select

from app.models import Category, Order, OrderItem, OrderStatus, Product


def test_product_order_relationships(session):
    cat = Category(name="Grooming", slug="grooming")
    product = Product(name="Beard Oil", slug="beard-oil", price_cents=2400, category=cat, stock=5)
    order = Order(order_number="SON-TEST0001", email="a@example.com")
    order.items.append(
        OrderItem(product_id=None, product_name="Beard Oil", unit_price_cents=2400, quantity=2)
    )
    session.add_all([cat, product, order])
    session.commit()

    stored = session.exec(select(Order)).one()
    assert stored.status == OrderStatus.pending
    assert stored.items[0].quantity == 2
    assert session.exec(select(Product)).one().category.slug == "grooming"
