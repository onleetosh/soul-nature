from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import SessionDep
from app.schemas.order import OrderCreate, OrderRead
from app.services.orders import CartError, create_order, find_order, quote_cart

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_pending_order(payload: OrderCreate, session: SessionDep):
    """Create an unpaid (pending) order. Paid orders are created by the Stripe webhook."""
    try:
        quote = quote_cart(session, payload.items)
    except CartError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return create_order(
        session,
        email=payload.email,
        customer_name=payload.customer_name,
        quote=quote,
        shipping_address=payload.shipping_address,
    )


@router.get("/lookup", response_model=OrderRead)
def lookup_order(
    session: SessionDep,
    email: Annotated[str, Query(min_length=3, max_length=320)],
    order_number: Annotated[str, Query(min_length=4, max_length=20)],
):
    order = find_order(session, email=email, order_number=order_number)
    if order is None:
        raise HTTPException(status_code=404, detail="No order found for that email and order number")
    return order
