import json
import logging

import stripe
from fastapi import APIRouter, Header, HTTPException, Request
from sqlmodel import select

from app.api.deps import SessionDep
from app.models import Order
from app.schemas.checkout import (
    CheckoutRequest,
    CheckoutSessionCreated,
    CheckoutSessionStatus,
)
from app.services.orders import CartError, quote_cart
from app.services.payments import (
    PAID_EVENTS,
    PaymentsNotConfigured,
    create_checkout_session,
    fulfill_checkout_session,
    verify_webhook,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["checkout"])


@router.post("/checkout/session", response_model=CheckoutSessionCreated)
def start_checkout(payload: CheckoutRequest, session: SessionDep):
    try:
        quote = quote_cart(session, payload.items)
        checkout = create_checkout_session(quote, payload.email)
    except CartError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except PaymentsNotConfigured as exc:
        raise HTTPException(status_code=503, detail="Payments are not configured") from exc
    except stripe.StripeError as exc:
        logger.exception("Stripe checkout session creation failed")
        raise HTTPException(status_code=502, detail="Could not start checkout, please try again") from exc
    return CheckoutSessionCreated(id=checkout.id, url=checkout.url)


@router.get("/checkout/session/{session_id}", response_model=CheckoutSessionStatus)
def checkout_status(session_id: str, session: SessionDep):
    order = session.exec(select(Order).where(Order.stripe_session_id == session_id)).first()
    if order is None:
        return CheckoutSessionStatus(status="processing")
    return CheckoutSessionStatus(status="complete", order_number=order.order_number, email=order.email)


@router.post("/stripe/webhook")
async def stripe_webhook(
    request: Request,
    session: SessionDep,
    stripe_signature: str | None = Header(default=None),
):
    payload = await request.body()
    try:
        verify_webhook(payload, stripe_signature)
    except PaymentsNotConfigured as exc:
        raise HTTPException(status_code=503, detail="Webhook secret is not configured") from exc
    except stripe.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Invalid signature") from exc

    event = json.loads(payload)
    if event.get("type") in PAID_EVENTS:
        data = event["data"]["object"]
        try:
            fulfill_checkout_session(session, data)
        except CartError:
            logger.exception("Could not build order for checkout session %s", data.get("id"))
    return {"received": True}
