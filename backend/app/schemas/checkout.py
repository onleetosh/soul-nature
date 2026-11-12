from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.schemas.order import MAX_CART_LINES, CartItem


class CheckoutRequest(BaseModel):
    email: EmailStr | None = None
    items: list[CartItem] = Field(min_length=1, max_length=MAX_CART_LINES)


class CheckoutSessionCreated(BaseModel):
    id: str
    url: str


class CheckoutSessionStatus(BaseModel):
    status: Literal["complete", "processing"]
    order_number: str | None = None
    email: str | None = None
