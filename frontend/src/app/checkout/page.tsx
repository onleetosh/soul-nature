"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useCart } from "@/components/cart-provider";
import { OrderSummary } from "@/components/order-summary";
import { clearOrderReference, postJson, readOrderReference, saveOrderReference } from "@/lib/orders";
import type { Order } from "@/lib/orders";

export default function CheckoutPage() {
  const { items, ready, storageBlocked } = useCart();
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [confirmNewOrder, setConfirmNewOrder] = useState(false);
  const locked = useRef(false);

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const reference = readOrderReference();
        if (reference) {
          const restored = await postJson<Order>("/api/orders/lookup", {
            email: reference.email, order_number: reference.orderNumber,
          });
          if (active) setOrder(restored);
        }
      } catch (error) {
        console.error("Could not restore checkout:", error);
        if (active) {
          setStorageError(true);
          setMessage("We could not restore your previous checkout. Check that the API and browser storage are available, then reload this page.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void restore();
    return () => { active = false; };
  }, []);

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || !ready || storageBlocked || !items.length) return;
    locked.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const created = await postJson<Order>("/api/orders", {
        customer_email: email,
        items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
      });
      setOrder(created);
      try {
        saveOrderReference({ email: created.customer_email, orderNumber: created.order_number });
      } catch (error) {
        console.error("Could not save checkout reference:", error);
        setStorageError(true);
        setMessage("Your order was created, but browser storage is unavailable. Record your order number and use order lookup; checkout cannot continue in this tab.");
      }
    } catch (error) {
      console.error("Could not create order:", error);
      setMessage(error instanceof Error ? error.message : "Could not create your order. Please try again.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  async function startPayment() {
    if (!order || locked.current || storageError) return;
    locked.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const result = await postJson<{ checkout_url: string }>("/api/checkout/sessions", {
        email: order.customer_email, order_number: order.order_number,
      });
      const url = new URL(result.checkout_url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") {
        throw new Error("The checkout service returned an invalid payment URL.");
      }
      window.location.assign(url.href);
    } catch (error) {
      console.error("Could not start checkout:", error);
      setMessage(error instanceof Error ? error.message : "Could not start checkout. Please try again.");
      locked.current = false;
      setBusy(false);
    }
  }

  function finishOrder() {
    try {
      clearOrderReference();
      setOrder(null);
      setMessage(null);
    } catch (error) {
      console.error("Could not clear checkout reference:", error);
      setMessage("Could not clear the saved order. Check browser storage and try again.");
    }
  }

  return (
    <main className="shop section-wrap">
      <p className="eyebrow">Guest checkout</p>
      <h1>Checkout</h1>
      {message && <p className="cart-error" role="alert">{message}</p>}
      {(loading || !ready) && <p role="status">Loading checkout...</p>}
      {!loading && ready && !order && !storageError && (
        storageBlocked ? <p>Please resolve the storage issue in your <Link className="text-link" href="/cart">cart</Link>.</p>
          : items.length === 0 ? <p>Your cart is empty. <Link className="text-link" href="/shop">Explore the shop</Link></p>
            : <form className="order-form" onSubmit={createOrder}>
                <p>Enter your email to create a pending order. You&apos;ll review the current prices before continuing to Stripe.</p>
                <label htmlFor="checkout-email">Email address</label>
                <input id="checkout-email" type="email" autoComplete="email" required maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} />
                <button className="button button-dark" disabled={busy}>{busy ? "Creating order..." : "Review order"}</button>
                <Link className="text-link" href="/cart">Back to cart</Link>
              </form>
      )}
      {!loading && order && (
        <>
          <p className="shop-intro">Save your order number. This order reflects the items and prices when it was created; changes to your cart do not update it.</p>
          <OrderSummary order={order} />
          {order.status === "pending" ? (
            <>
              <p className="shop-intro">Payment is not confirmed until the payment webhook marks this order paid. Checkout uses Stripe test mode only.</p>
              <button type="button" className="button button-dark" disabled={busy || storageError} onClick={startPayment}>{busy ? "Opening Stripe..." : "Continue to Stripe"}</button>
              <p><Link className="text-link" href="/orders">Check order status</Link></p>
              <div className="order-form">
                <p>Need a new order? First check this order&apos;s status. A previous payment or checkout link may still be active; creating a new order could result in paying twice.</p>
                <label><input className="order-checkbox" type="checkbox" checked={confirmNewOrder} onChange={(event) => setConfirmNewOrder(event.target.checked)} /> I understand and want to start a new order.</label>
                <button type="button" className="text-link" disabled={!confirmNewOrder || busy} onClick={finishOrder}>Start a new order</button>
              </div>
            </>
          ) : (
            <>
              <p className="shop-intro">This order is no longer pending. Your cart has not been cleared automatically.</p>
              <button type="button" className="button button-dark" onClick={finishOrder}>Start a new order</button>
            </>
          )}
        </>
      )}
    </main>
  );
}
