from datetime import datetime
from enum import StrEnum

from sqlalchemy import Column, DateTime, String
from sqlalchemy import Enum as SAEnum
from sqlmodel import Field, Relationship, SQLModel

from app.models.base import utcnow


class OrderStatus(StrEnum):
    pending = "pending"
    paid = "paid"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class Order(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    order_number: str = Field(max_length=20, unique=True, index=True)
    email: str = Field(max_length=320, index=True)
    customer_name: str = Field(default="", max_length=200)
    status: OrderStatus = Field(
        default=OrderStatus.pending,
        sa_column=Column(SAEnum(OrderStatus, native_enum=False, length=20), nullable=False),
    )
    currency: str = Field(default="usd", max_length=3)
    subtotal_cents: int = Field(default=0, ge=0)
    shipping_cents: int = Field(default=0, ge=0)
    total_cents: int = Field(default=0, ge=0)

    shipping_line1: str = Field(default="", max_length=200)
    shipping_line2: str = Field(default="", max_length=200)
    shipping_city: str = Field(default="", max_length=100)
    shipping_state: str = Field(default="", max_length=100)
    shipping_postal_code: str = Field(default="", max_length=20)
    shipping_country: str = Field(default="", max_length=2)

    stripe_session_id: str | None = Field(
        default=None, sa_column=Column(String(255), unique=True, index=True, nullable=True)
    )
    stripe_payment_intent_id: str | None = Field(default=None, max_length=255)

    created_at: datetime = Field(default_factory=utcnow, sa_type=DateTime(timezone=True))
    updated_at: datetime = Field(default_factory=utcnow, sa_type=DateTime(timezone=True))

    items: list["OrderItem"] = Relationship(
        back_populates="order", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class OrderItem(SQLModel, table=True):
    __tablename__ = "order_item"

    id: int | None = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id", index=True)
    product_id: int | None = Field(default=None, foreign_key="product.id", ondelete="SET NULL")
    product_name: str = Field(max_length=200)
    unit_price_cents: int = Field(ge=0)
    quantity: int = Field(ge=1)

    order: Order | None = Relationship(back_populates="items")
