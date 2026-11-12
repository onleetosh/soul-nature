import logging
from typing import Any

import stripe
from sqlmodel import Session, col, select

from app.core.config import get_settings
from app.models import Order, OrderStatus, Product
from app.schemas.order import ShippingAddress
from app.services.orders import (
    CartError,
    CartLine,
    CartQuote,
    create_order,
    shipping_for,
)

logger = logging.getLogger(__name__)

WEBHOOK_TOLERANCE_SECONDS = 300

PAID_EVENTS = {"checkout.session.completed", "checkout.session.async_payment_succeeded"}
FULFILLABLE_PAYMENT_STATUSES = {"paid", "no_payment_required"}
METADATA_VALUE_LIMIT = 500


class PaymentsNotConfigured(RuntimeError):
    pass


def encode_cart(quote: CartQuote) -> dict[str, str]:
    """Snapshot `product_id:quantity:unit_price_cents` per line into Stripe metadata (500-char values)."""
    value = ",".join(f"{line.product_id}:{line.quantity}:{line.unit_price_cents}" for line in quote.lines)
    return {
        f"cart_{i // METADATA_VALUE_LIMIT}": value[i : i + METADATA_VALUE_LIMIT]
        for i in range(0, len(value), METADATA_VALUE_LIMIT)
    }


def decode_cart(metadata: dict[str, str]) -> list[tuple[int, int, int | None]]:
    if "cart" in metadata:
        value = metadata["cart"]
    else:
        chunks = sorted((k for k in metadata if k.startswith("cart_")), key=lambda k: int(k.removeprefix("cart_")))
        value = "".join(metadata[k] for k in chunks)
    entries: list[tuple[int, int, int | None]] = []
    for part in filter(None, value.split(",")):
        fields = [int(f) for f in part.split(":")]
        entries.append((fields[0], fields[1], fields[2] if len(fields) > 2 else None))
    return entries


def _paid_quote(session: Session, data: dict[str, Any]) -> CartQuote:
    """Rebuild the cart at the prices the customer was charged, even if products changed since."""
    entries = decode_cart(data.get("metadata") or {})
    if not entries:
        raise CartError("Checkout session has no cart metadata")
    ids = [product_id for product_id, _, _ in entries]
    products = {p.id: p for p in session.exec(select(Product).where(col(Product.id).in_(ids))).all()}
    lines = []
    for product_id, quantity, unit_price in entries:
        product = products.get(product_id)
        if unit_price is None:
            if product is None:
                raise CartError(f"Product {product_id} no longer exists")
            unit_price = product.price_cents
        lines.append(
            CartLine(
                product_id=product_id,
                name=product.name if product else f"Product #{product_id}",
                unit_price_cents=unit_price,
                quantity=quantity,
                product=product,
            )
        )
    subtotal = sum(line.line_total_cents for line in lines)
    shipping = (data.get("total_details") or {}).get("amount_shipping")
    return CartQuote(
        lines=lines, subtotal_cents=subtotal, shipping_cents=shipping_for(subtotal) if shipping is None else shipping
    )


def create_checkout_session(quote: CartQuote, email: str | None = None) -> Any:
    settings = get_settings()
    if not settings.stripe_secret_key:
        raise PaymentsNotConfigured("STRIPE_SECRET_KEY is not set")

    params: dict[str, Any] = {
        "mode": "payment",
        "line_items": [
            {
                "quantity": line.quantity,
                "price_data": {
                    "currency": settings.currency,
                    "unit_amount": line.unit_price_cents,
                    "product_data": {
                        "name": line.name,
                        "metadata": {"product_id": str(line.product_id)},
                    },
                },
            }
            for line in quote.lines
        ],
        "shipping_address_collection": {"allowed_countries": ["US"]},
        "shipping_options": [
            {
                "shipping_rate_data": {
                    "type": "fixed_amount",
                    "display_name": "Free shipping" if quote.shipping_cents == 0 else "Standard shipping",
                    "fixed_amount": {"amount": quote.shipping_cents, "currency": settings.currency},
                    "delivery_estimate": {
                        "minimum": {"unit": "business_day", "value": 3},
                        "maximum": {"unit": "business_day", "value": 7},
                    },
                }
            }
        ],
        "metadata": encode_cart(quote),
        "success_url": f"{settings.frontend_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
        "cancel_url": f"{settings.frontend_url}/cart",
    }
    if email:
        params["customer_email"] = email
    return stripe.checkout.Session.create(api_key=settings.stripe_secret_key, **params)


def verify_webhook(payload: bytes, signature: str | None) -> None:
    settings = get_settings()
    if not settings.stripe_webhook_secret:
        raise PaymentsNotConfigured("STRIPE_WEBHOOK_SECRET is not set")
    stripe.WebhookSignature.verify_header(
        payload, signature, settings.stripe_webhook_secret, tolerance=WEBHOOK_TOLERANCE_SECONDS
    )


def _shipping_from_session(data: dict[str, Any]) -> tuple[str, ShippingAddress]:
    details = (data.get("collected_information") or {}).get("shipping_details") or data.get("shipping_details") or {}
    customer = data.get("customer_details") or {}
    address = details.get("address") or customer.get("address") or {}
    name = details.get("name") or customer.get("name") or ""
    return name, ShippingAddress(
        line1=address.get("line1") or "",
        line2=address.get("line2") or "",
        city=address.get("city") or "",
        state=address.get("state") or "",
        postal_code=address.get("postal_code") or "",
        country=address.get("country") or "",
    )


def fulfill_checkout_session(session: Session, data: dict[str, Any]) -> Order | None:
    """Create a paid order from a completed Stripe Checkout Session (idempotent)."""
    if data.get("payment_status") not in FULFILLABLE_PAYMENT_STATUSES:
        return None

    existing = session.exec(select(Order).where(Order.stripe_session_id == data["id"])).first()
    if existing is not None:
        return existing

    quote = _paid_quote(session, data)

    email = (data.get("customer_details") or {}).get("email") or data.get("customer_email") or ""
    name, address = _shipping_from_session(data)
    return create_order(
        session,
        email=email,
        customer_name=name,
        quote=quote,
        status=OrderStatus.paid,
        shipping_address=address,
        stripe_session_id=data["id"],
        stripe_payment_intent_id=data.get("payment_intent"),
        total_cents=data.get("amount_total"),
    )
