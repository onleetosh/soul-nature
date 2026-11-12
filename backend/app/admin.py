from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.admin_auth import require_admin
from app.database import get_session
from app.models import Category, Order, Product
from app.schemas import AdminProductRead, AdminProductWrite, OrderRead


router = APIRouter(
    prefix="/api/v1/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


def get_admin_product(product_id: int, session: Session) -> Product:
    product = session.scalar(
        select(Product)
        .options(joinedload(Product.category))
        .where(Product.id == product_id)
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def save_product(
    product: Product, payload: AdminProductWrite, session: Session
) -> Product:
    product_id = product.id
    if session.get(Category, payload.category_id) is None:
        raise HTTPException(status_code=422, detail="Category not found")

    duplicate = session.scalar(
        select(Product.id).where(
            or_(Product.sku == payload.sku, Product.slug == payload.slug),
            Product.id != product_id if product_id is not None else True,
        )
    )
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="SKU or slug already exists")

    for field, value in payload.model_dump().items():
        setattr(product, field, value)
    session.add(product)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        duplicate = session.scalar(
            select(Product.id).where(
                or_(Product.sku == payload.sku, Product.slug == payload.slug),
                Product.id != product_id if product_id is not None else True,
            )
        )
        if duplicate is not None:
            raise HTTPException(status_code=409, detail="SKU or slug already exists")
        raise
    session.refresh(product)
    return product


@router.get("/products", response_model=list[AdminProductRead])
def list_admin_products(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session),
) -> list[Product]:
    return list(
        session.scalars(
            select(Product)
            .options(joinedload(Product.category))
            .order_by(Product.id)
            .limit(limit)
            .offset(offset)
        ).all()
    )


@router.get("/products/{product_id}", response_model=AdminProductRead)
def read_admin_product(
    product_id: int, session: Session = Depends(get_session)
) -> Product:
    return get_admin_product(product_id, session)


@router.post("/products", response_model=AdminProductRead, status_code=201)
def create_admin_product(
    payload: AdminProductWrite, session: Session = Depends(get_session)
) -> Product:
    return save_product(Product(), payload, session)


@router.put("/products/{product_id}", response_model=AdminProductRead)
def update_admin_product(
    product_id: int,
    payload: AdminProductWrite,
    session: Session = Depends(get_session),
) -> Product:
    return save_product(get_admin_product(product_id, session), payload, session)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_admin_product(
    product_id: int, session: Session = Depends(get_session)
) -> Response:
    product = get_admin_product(product_id, session)
    product.is_active = False
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/orders", response_model=list[OrderRead])
def list_admin_orders(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session),
) -> list[Order]:
    return list(
        session.scalars(
            select(Order)
            .options(joinedload(Order.items))
            .order_by(Order.id.desc())
            .limit(limit)
            .offset(offset)
        ).unique().all()
    )
