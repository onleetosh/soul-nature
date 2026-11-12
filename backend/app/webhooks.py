import logging
import os

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_session
from app.models import CheckoutAttempt, Order


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["checkout"])


@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None),
    session: Session = Depends(get_session),
) -> dict[str, str]:
    secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    if not secret.startswith("whsec_"):
        raise HTTPException(status_code=503, detail="Stripe webhook is not configured")
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe signature")

    try:
        event = stripe.Webhook.construct_event(
            await request.body(), stripe_signature, secret
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook")

    if event.type not in (
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
    ):
        return {"status": "ignored"}

    checkout = event.data.object
    if event.livemode or checkout.livemode:
        raise HTTPException(status_code=400, detail="Live-mode events are not accepted")
    if checkout.payment_status != "paid":
        return {"status": "ignored"}

    order = session.scalar(
        select(Order).where(Order.order_number == checkout.client_reference_id)
    )
    attempt = session.get(CheckoutAttempt, order.id) if order else None
    if (
        order is None
        or attempt is None
        or checkout.mode != "payment"
        or checkout.currency != "usd"
        or checkout.amount_total != order.total_cents
        or not checkout.id
        or (attempt.stripe_session_id is not None and attempt.stripe_session_id != checkout.id)
    ):
        logger.error("Stripe webhook does not match a checkout attempt")
        raise HTTPException(status_code=400, detail="Checkout does not match an order")
    if order.status not in ("pending", "paid"):
        logger.error("Stripe payment cannot update order %s in status %s", order.order_number, order.status)
        raise HTTPException(status_code=409, detail="Order cannot be marked paid")

    attempt.stripe_session_id = checkout.id
    order.status = "paid"
    session.commit()
    return {"status": "received"}
