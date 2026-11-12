import secrets
import string
from dataclasses import dataclass

from sqlmodel import Session, col, select

from app.core.config import get_settings
from app.models import Order, OrderItem, OrderStatus, Product
from app.schemas.order import CartItem, ShippingAddress

ORDER_NUMBER_ALPHABET = string.ascii_uppercase.replace("O", "").replace("I", "") + "23456789"
MAX_QUANTITY_PER_ITEM = 20


class CartError(ValueError):
    """Raised when a cart references unavailable products or quantities."""


@dataclass
class CartLine:
    product_id: int
    name: str
    unit_price_cents: int
    quantity: int
    product: Product | None = None

    @property
    def line_total_cents(self) -> int:
        return self.unit_price_cents * self.quantity


@dataclass
class CartQuote:
    lines: list[CartLine]
    subtotal_cents: int
    shipping_cents: int

    @property
    def total_cents(self) -> int:
        return self.subtotal_cents + self.shipping_cents


def shipping_for(subtotal_cents: int) -> int:
    settings = get_settings()
    return 0 if subtotal_cents >= settings.free_shipping_threshold_cents else settings.shipping_flat_cents


def quote_cart(
    session: Session,
    items: list[CartItem],
    *,
    enforce_stock: bool = True,
    require_active: bool = True,
) -> CartQuote:
    quantities: dict[int, int] = {}
    for item in items:
        quantities[item.product_id] = quantities.get(item.product_id, 0) + item.quantity

    products = {
        p.id: p for p in session.exec(select(Product).where(col(Product.id).in_(quantities.keys()))).all()
    }
    lines: list[CartLine] = []
    for product_id, quantity in quantities.items():
        product = products.get(product_id)
        if product is None or (require_active and not product.is_active):
            raise CartError(f"Product {product_id} is not available")
        if quantity > MAX_QUANTITY_PER_ITEM:
            raise CartError(f"You can order at most {MAX_QUANTITY_PER_ITEM} of {product.name}")
        if enforce_stock and quantity > product.stock:
            raise CartError(f"Only {product.stock} of {product.name} left in stock")
        lines.append(
            CartLine(
                product_id=product_id,
                name=product.name,
                unit_price_cents=product.price_cents,
                quantity=quantity,
                product=product,
            )
        )

    subtotal = sum(line.line_total_cents for line in lines)
    return CartQuote(lines=lines, subtotal_cents=subtotal, shipping_cents=shipping_for(subtotal))


def generate_order_number(session: Session) -> str:
    while True:
        candidate = "SON-" + "".join(secrets.choice(ORDER_NUMBER_ALPHABET) for _ in range(8))
        if session.exec(select(Order.id).where(Order.order_number == candidate)).first() is None:
            return candidate


def create_order(
    session: Session,
    *,
    email: str,
    quote: CartQuote,
    customer_name: str = "",
    status: OrderStatus = OrderStatus.pending,
    shipping_address: ShippingAddress | None = None,
    stripe_session_id: str | None = None,
    stripe_payment_intent_id: str | None = None,
    total_cents: int | None = None,
) -> Order:
    settings = get_settings()
    address = shipping_address or ShippingAddress()
    order = Order(
        order_number=generate_order_number(session),
        email=email.strip().lower(),
        customer_name=customer_name,
        status=status,
        currency=settings.currency,
        subtotal_cents=quote.subtotal_cents,
        shipping_cents=quote.shipping_cents,
        total_cents=quote.total_cents if total_cents is None else total_cents,
        shipping_line1=address.line1,
        shipping_line2=address.line2,
        shipping_city=address.city,
        shipping_state=address.state,
        shipping_postal_code=address.postal_code,
        shipping_country=address.country,
        stripe_session_id=stripe_session_id,
        stripe_payment_intent_id=stripe_payment_intent_id,
    )
    for line in quote.lines:
        order.items.append(
            OrderItem(
                product_id=line.product.id if line.product is not None else None,
                product_name=line.name,
                unit_price_cents=line.unit_price_cents,
                quantity=line.quantity,
            )
        )
        if status == OrderStatus.paid and line.product is not None:
            line.product.stock = max(0, line.product.stock - line.quantity)
            session.add(line.product)

    session.add(order)
    session.commit()
    session.refresh(order)
    return order


def find_order(session: Session, *, email: str, order_number: str) -> Order | None:
    return session.exec(
        select(Order).where(
            Order.order_number == order_number.strip().upper(),
            Order.email == email.strip().lower(),
        )
    ).first()
