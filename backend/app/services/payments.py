import logging
from typing import Any

import stripe
from sqlmodel import Session, select

from app.core.config import get_settings
from app.models import Order, OrderStatus
from app.schemas.order import CartItem, ShippingAddress
from app.services.orders import CartQuote, create_order, quote_cart

logger = logging.getLogger(__name__)

PAID_EVENTS = {"checkout.session.completed", "checkout.session.async_payment_succeeded"}


class PaymentsNotConfigured(RuntimeError):
    pass


def encode_cart(quote: CartQuote) -> str:
    return ",".join(f"{line.product.id}:{line.quantity}" for line in quote.lines)


def decode_cart(value: str) -> list[CartItem]:
    items = []
    for part in filter(None, value.split(",")):
        product_id, quantity = part.split(":")
        items.append(CartItem(product_id=int(product_id), quantity=int(quantity)))
    return items


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
                    "unit_amount": line.product.price_cents,
                    "product_data": {
                        "name": line.product.name,
                        "metadata": {"product_id": str(line.product.id)},
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
        "metadata": {"cart": encode_cart(quote)},
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
    stripe.WebhookSignature.verify_header(payload, signature, settings.stripe_webhook_secret)


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
    if data.get("payment_status") != "paid":
        return None

    existing = session.exec(select(Order).where(Order.stripe_session_id == data["id"])).first()
    if existing is not None:
        return existing

    items = decode_cart((data.get("metadata") or {}).get("cart", ""))
    quote = quote_cart(session, items, enforce_stock=False, require_active=False)
    shipping = (data.get("total_details") or {}).get("amount_shipping")
    if shipping is not None:
        quote.shipping_cents = shipping

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
