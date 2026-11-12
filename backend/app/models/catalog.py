from datetime import datetime

from sqlalchemy import DateTime, Text
from sqlmodel import Field, Relationship, SQLModel

from app.models.base import utcnow


class Category(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    slug: str = Field(max_length=100, unique=True, index=True)
    description: str = Field(default="", sa_type=Text)

    products: list["Product"] = Relationship(back_populates="category")


class Product(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=200)
    slug: str = Field(max_length=200, unique=True, index=True)
    description: str = Field(default="", sa_type=Text)
    ingredients: str = Field(default="", sa_type=Text)
    size: str = Field(default="", max_length=50)
    price_cents: int = Field(ge=0)
    image_url: str | None = Field(default=None, max_length=500)
    stock: int = Field(default=0, ge=0)
    is_active: bool = Field(default=True)
    is_featured: bool = Field(default=False)
    category_id: int = Field(foreign_key="category.id", index=True)
    created_at: datetime = Field(default_factory=utcnow, sa_type=DateTime(timezone=True))
    updated_at: datetime = Field(default_factory=utcnow, sa_type=DateTime(timezone=True))

    category: Category | None = Relationship(back_populates="products")
