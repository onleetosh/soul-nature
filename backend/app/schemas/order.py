from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import OrderStatus

MAX_CART_LINES = 50


class CartItem(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=20)


class ShippingAddress(BaseModel):
    line1: str = Field(default="", max_length=200)
    line2: str = Field(default="", max_length=200)
    city: str = Field(default="", max_length=100)
    state: str = Field(default="", max_length=100)
    postal_code: str = Field(default="", max_length=20)
    country: str = Field(default="", max_length=2)


class OrderCreate(BaseModel):
    email: EmailStr
    customer_name: str = Field(default="", max_length=200)
    items: list[CartItem] = Field(min_length=1, max_length=MAX_CART_LINES)
    shipping_address: ShippingAddress | None = None


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int | None
    product_name: str
    unit_price_cents: int
    quantity: int


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    email: str
    customer_name: str
    status: OrderStatus
    currency: str
    subtotal_cents: int
    shipping_cents: int
    total_cents: int
    shipping_line1: str
    shipping_line2: str
    shipping_city: str
    shipping_state: str
    shipping_postal_code: str
    shipping_country: str
    created_at: datetime
    items: list[OrderItemRead]
