from sqlmodel import func, select

from app.models import Category, Product
from app.seed import CATEGORIES, PRODUCTS, seed


def test_seed_is_idempotent(session):
    seed(session)
    seed(session)
    assert session.exec(select(func.count()).select_from(Category)).one() == len(CATEGORIES)
    assert session.exec(select(func.count()).select_from(Product)).one() == len(PRODUCTS)
