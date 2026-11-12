from sqlmodel import func, select

from app.models import Category, Product
from app.seed import CATEGORIES, PRODUCTS, seed


def test_seed_is_idempotent(session):
    seed(session)
    seed(session)
    assert session.exec(select(func.count()).select_from(Category)).one() == len(CATEGORIES)
    assert session.exec(select(func.count()).select_from(Product)).one() == len(PRODUCTS)


def test_seed_keeps_existing_edits(session):
    seed(session)
    product = session.exec(select(Product).where(Product.slug == PRODUCTS[0]["slug"])).one()
    product.price_cents = 1
    product.stock = 3
    session.add(product)
    session.commit()

    seed(session)
    session.refresh(product)
    assert (product.price_cents, product.stock) == (1, 3)
