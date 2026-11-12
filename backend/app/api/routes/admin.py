from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import selectinload
from sqlmodel import col, func, or_, select

from app.api.deps import SessionDep, require_admin
from app.models import Category, Order, OrderStatus, Product
from app.models.base import utcnow
from app.schemas.admin import OrderList, OrderStatusUpdate, ProductCreate, ProductUpdate
from app.schemas.catalog import ProductRead
from app.schemas.order import OrderRead

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


def _get_product_or_404(session: SessionDep, product_id: int) -> Product:
    product = session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def _validate_product_refs(session: SessionDep, *, slug: str | None, category_id: int | None, exclude_id=None):
    if category_id is not None and session.get(Category, category_id) is None:
        raise HTTPException(status_code=400, detail="Category does not exist")
    if slug is not None:
        clash = session.exec(select(Product).where(Product.slug == slug)).first()
        if clash is not None and clash.id != exclude_id:
            raise HTTPException(status_code=409, detail="A product with that slug already exists")


@router.get("/products", response_model=list[ProductRead])
def admin_list_products(session: SessionDep):
    return session.exec(
        select(Product).options(selectinload(Product.category)).order_by(Product.id)  # type: ignore[arg-type]
    ).all()


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def admin_create_product(payload: ProductCreate, session: SessionDep):
    _validate_product_refs(session, slug=payload.slug, category_id=payload.category_id)
    product = Product(**payload.model_dump())
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


@router.get("/products/{product_id}", response_model=ProductRead)
def admin_get_product(product_id: int, session: SessionDep):
    return _get_product_or_404(session, product_id)


@router.patch("/products/{product_id}", response_model=ProductRead)
def admin_update_product(product_id: int, payload: ProductUpdate, session: SessionDep):
    product = _get_product_or_404(session, product_id)
    changes = payload.model_dump(exclude_unset=True)
    _validate_product_refs(
        session, slug=changes.get("slug"), category_id=changes.get("category_id"), exclude_id=product.id
    )
    product.sqlmodel_update(changes)
    product.updated_at = utcnow()
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_product(product_id: int, session: SessionDep):
    session.delete(_get_product_or_404(session, product_id))
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/orders", response_model=OrderList)
def admin_list_orders(
    session: SessionDep,
    status_filter: Annotated[OrderStatus | None, Query(alias="status")] = None,
    q: Annotated[str | None, Query(max_length=320, description="Email or order number")] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    stmt = select(Order)
    if status_filter is not None:
        stmt = stmt.where(Order.status == status_filter)
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(or_(col(Order.email).ilike(pattern), col(Order.order_number).ilike(pattern)))
    total = session.exec(select(func.count()).select_from(stmt.subquery())).one()
    items = session.exec(
        stmt.options(selectinload(Order.items))  # type: ignore[arg-type]
        .order_by(col(Order.created_at).desc(), col(Order.id).desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return OrderList(items=items, total=total)


@router.get("/orders/{order_id}", response_model=OrderRead)
def admin_get_order(order_id: int, session: SessionDep):
    order = session.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/orders/{order_id}", response_model=OrderRead)
def admin_update_order_status(order_id: int, payload: OrderStatusUpdate, session: SessionDep):
    order = session.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    order.updated_at = utcnow()
    session.add(order)
    session.commit()
    session.refresh(order)
    return order
