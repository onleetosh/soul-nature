from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.orm import selectinload
from sqlmodel import col, func, or_, select

from app.api.deps import SessionDep
from app.models import Category, Product
from app.schemas.catalog import CategoryRead, ProductList, ProductRead

router = APIRouter(tags=["catalog"])

SORTS = {
    "newest": col(Product.created_at).desc(),
    "price_asc": col(Product.price_cents).asc(),
    "price_desc": col(Product.price_cents).desc(),
    "name": col(Product.name).asc(),
}


@router.get("/categories", response_model=list[CategoryRead])
def list_categories(session: SessionDep):
    return session.exec(select(Category).order_by(Category.id)).all()


@router.get("/products", response_model=ProductList)
def list_products(
    session: SessionDep,
    category: Annotated[str | None, Query(description="Category slug")] = None,
    featured: bool | None = None,
    q: Annotated[str | None, Query(max_length=100)] = None,
    sort: Literal["newest", "price_asc", "price_desc", "name"] = "name",
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    stmt = select(Product).where(Product.is_active == True)  # noqa: E712
    if category:
        stmt = stmt.join(Category).where(Category.slug == category)
    if featured is not None:
        stmt = stmt.where(Product.is_featured == featured)
    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(or_(col(Product.name).ilike(pattern), col(Product.description).ilike(pattern)))

    total = session.exec(select(func.count()).select_from(stmt.subquery())).one()
    items = session.exec(
        stmt.options(selectinload(Product.category))  # type: ignore[arg-type]
        .order_by(SORTS[sort], col(Product.id))
        .offset(offset)
        .limit(limit)
    ).all()
    return ProductList(items=items, total=total)


@router.get("/products/slug/{slug}", response_model=ProductRead)
def get_product_by_slug(slug: str, session: SessionDep):
    product = session.exec(select(Product).where(Product.slug == slug, Product.is_active == True)).first()  # noqa: E712
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/products/{product_id}", response_model=ProductRead)
def get_product(product_id: int, session: SessionDep):
    product = session.get(Product, product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
