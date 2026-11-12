import logging
import os
from datetime import datetime, timedelta, timezone

import stripe
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.database import get_session
from app.models import CheckoutAttempt, Order
from app.schemas import CheckoutCreate, CheckoutRead


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["checkout"])


@router.post("/checkout/sessions", response_model=CheckoutRead)
def create_checkout_session(
    payload: CheckoutCreate,
    session: Session = Depends(get_session),
) -> CheckoutRead:
    api_key = os.getenv("STRIPE_SECRET_KEY", "")
    success_url = os.getenv("STRIPE_SUCCESS_URL", "")
    cancel_url = os.getenv("STRIPE_CANCEL_URL", "")
    if not api_key.startswith("sk_test_") or not success_url or not cancel_url:
        raise HTTPException(status_code=503, detail="Stripe test checkout is not configured")

    order = session.scalar(
        select(Order)
        .options(joinedload(Order.items))
        .where(
            Order.order_number == payload.order_number,
            Order.customer_email == str(payload.email).strip().lower(),
        )
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "pending":
        raise HTTPException(status_code=409, detail="Order is not pending")
    if order.total_cents <= 0:
        raise HTTPException(status_code=409, detail="Order total must be positive")

    attempt = session.get(CheckoutAttempt, order.id)
    if attempt is None:
        attempt = CheckoutAttempt(order_id=order.id)
        session.add(attempt)
        try:
            session.commit()
        except IntegrityError:
            session.rollback()
            attempt = session.get(CheckoutAttempt, order.id)
            if attempt is None:
                raise

    try:
        if attempt.stripe_session_id:
            checkout = stripe.checkout.Session.retrieve(
                attempt.stripe_session_id, api_key=api_key
            )
        else:
            created_at = attempt.created_at.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) - created_at >= timedelta(hours=23):
                raise HTTPException(
                    status_code=409,
                    detail="Checkout needs manual reconciliation before retrying",
                )
            checkout = stripe.checkout.Session.create(
                api_key=api_key,
                idempotency_key=f"checkout-{order.order_number}",
                mode="payment",
                payment_method_types=["card"],
                client_reference_id=order.order_number,
                customer_email=order.customer_email,
                success_url=success_url,
                cancel_url=cancel_url,
                line_items=[
                    {
                        "price_data": {
                            "currency": "usd",
                            "product_data": {"name": item.product_name},
                            "unit_amount": item.unit_price_cents,
                        },
                        "quantity": item.quantity,
                    }
                    for item in order.items
                ],
            )
            attempt.stripe_session_id = checkout.id
            session.commit()
    except stripe.error.StripeError:
        logger.exception("Stripe checkout request failed for order %s", order.order_number)
        raise HTTPException(status_code=502, detail="Stripe checkout request failed")

    if checkout.livemode or checkout.status != "open" or not checkout.url:
        raise HTTPException(
            status_code=409,
            detail="Checkout is no longer open; check the order status",
        )
    return CheckoutRead(checkout_url=checkout.url)
