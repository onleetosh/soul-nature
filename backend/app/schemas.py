from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str | None


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sku: str
    name: str
    slug: str
    description: str
    price_cents: int = Field(ge=0)
    image_url: str | None
    stock_quantity: int = Field(ge=0)
    category: CategoryRead


class OrderItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(ge=1, le=99)


class OrderCreate(BaseModel):
    customer_email: EmailStr
    items: list[OrderItemCreate] = Field(min_length=1, max_length=50)

    @field_validator("customer_email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("items")
    @classmethod
    def require_unique_products(
        cls,
        items: list[OrderItemCreate],
    ) -> list[OrderItemCreate]:
        product_ids = [item.product_id for item in items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Each product may only appear once per order")
        return items


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int | None
    product_name: str
    unit_price_cents: int = Field(ge=0)
    quantity: int = Field(ge=1)


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    customer_email: EmailStr
    status: str
    subtotal_cents: int = Field(ge=0)
    total_cents: int = Field(ge=0)
    items: list[OrderItemRead]


class CheckoutCreate(BaseModel):
    email: EmailStr
    order_number: str = Field(
        min_length=28, max_length=28, pattern=r"^SON-[A-F0-9]{24}$"
    )


class CheckoutRead(BaseModel):
    checkout_url: str
