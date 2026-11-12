from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str
    ingredients: str
    size: str
    price_cents: int
    image_url: str | None
    stock: int
    is_active: bool
    is_featured: bool
    category_id: int
    category: CategoryRead | None
    created_at: datetime
    updated_at: datetime


class ProductList(BaseModel):
    items: list[ProductRead]
    total: int
