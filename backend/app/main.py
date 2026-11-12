from contextlib import asynccontextmanager
import os
import secrets

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import EmailStr
from sqlalchemy import select, text
from sqlalchemy.orm import Session, joinedload

from app.admin import router as admin_router
from app.checkout import router as checkout_router
from app.database import create_database_tables, engine, get_session
from app.models import Category, Order, OrderItem, Product
from app.schemas import CategoryRead, OrderCreate, OrderRead, ProductRead
from app.webhooks import router as webhook_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_database_tables()
    yield
    engine.dispose()


app = FastAPI(title="Soul of Nature API", version="0.1.0", lifespan=lifespan)
app.include_router(admin_router)
app.include_router(checkout_router)
app.include_router(webhook_router)

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check(session: Session = Depends(get_session)) -> dict[str, str]:
    session.execute(text("SELECT 1"))
    return {"status": "ok"}


@app.get("/api/v1/categories", response_model=list[CategoryRead])
def list_categories(session: Session = Depends(get_session)) -> list[Category]:
    return list(session.scalars(select(Category).order_by(Category.name)).all())


@app.get("/api/v1/products", response_model=list[ProductRead])
def list_products(
    category: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session),
) -> list[Product]:
    statement = (
        select(Product)
        .options(joinedload(Product.category))
        .where(Product.is_active.is_(True))
        .order_by(Product.id)
        .limit(limit)
        .offset(offset)
    )
    if category:
        statement = statement.join(Product.category).where(Category.slug == category)

    return list(session.scalars(statement).unique().all())


@app.get("/api/v1/products/{product_id}", response_model=ProductRead)
def get_product(
    product_id: int,
    session: Session = Depends(get_session),
) -> Product:
    product = session.scalar(
        select(Product)
        .options(joinedload(Product.category))
        .where(Product.id == product_id, Product.is_active.is_(True))
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.post("/api/v1/orders", response_model=OrderRead, status_code=201)
def create_order(
    payload: OrderCreate,
    session: Session = Depends(get_session),
) -> Order:
    product_ids = [item.product_id for item in payload.items]
    products = session.scalars(
        select(Product).where(
            Product.id.in_(product_ids),
            Product.is_active.is_(True),
        )
    ).all()
    products_by_id = {product.id: product for product in products}

    for requested_item in payload.items:
        product = products_by_id.get(requested_item.product_id)
        if product is None:
            raise HTTPException(
                status_code=404,
                detail=f"Product {requested_item.product_id} not found",
            )
        if requested_item.quantity > product.stock_quantity:
            raise HTTPException(
                status_code=409,
                detail=f"Insufficient stock for product {product.id}",
            )

    order_items = [
        OrderItem(
            product_id=product.id,
            product_name=product.name,
            unit_price_cents=product.price_cents,
            quantity=requested_item.quantity,
        )
        for requested_item in payload.items
        for product in [products_by_id[requested_item.product_id]]
    ]
    subtotal_cents = sum(
        item.unit_price_cents * item.quantity for item in order_items
    )
    order = Order(
        order_number=f"SON-{secrets.token_hex(12).upper()}",
        customer_email=str(payload.customer_email),
        status="pending",
        subtotal_cents=subtotal_cents,
        total_cents=subtotal_cents,
        items=order_items,
    )

    session.add(order)
    session.commit()
    session.refresh(order)
    return order


@app.get("/api/v1/orders/lookup", response_model=OrderRead)
def lookup_order(
    email: EmailStr,
    order_number: str = Query(
        min_length=28,
        max_length=28,
        pattern=r"^SON-[A-F0-9]{24}$",
    ),
    session: Session = Depends(get_session),
) -> Order:
    order = session.execute(
        select(Order)
        .options(joinedload(Order.items))
        .where(
            Order.customer_email == email.strip().lower(),
            Order.order_number == order_number,
        )
    ).unique().scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
