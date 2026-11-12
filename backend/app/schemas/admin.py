from pydantic import BaseModel, Field

from app.models import OrderStatus
from app.schemas.order import OrderRead

SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=200, pattern=SLUG_PATTERN)
    description: str = ""
    ingredients: str = ""
    size: str = Field(default="", max_length=50)
    price_cents: int = Field(ge=0)
    image_url: str | None = Field(default=None, max_length=500)
    stock: int = Field(default=0, ge=0)
    is_active: bool = True
    is_featured: bool = False
    category_id: int


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, min_length=1, max_length=200, pattern=SLUG_PATTERN)
    description: str | None = None
    ingredients: str | None = None
    size: str | None = Field(default=None, max_length=50)
    price_cents: int | None = Field(default=None, ge=0)
    image_url: str | None = Field(default=None, max_length=500)
    stock: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    is_featured: bool | None = None
    category_id: int | None = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderList(BaseModel):
    items: list[OrderRead]
    total: int
