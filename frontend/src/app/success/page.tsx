"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OrderSummary } from "@/components/order-summary";
import { postJson, readOrderReference } from "@/lib/orders";
import type { Order } from "@/lib/orders";

export default function SuccessPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    async function lookup() {
      setLoading(true);
      setMessage(null);
      setOrder(null);
      try {
        const reference = readOrderReference();
        if (!reference) {
          if (active) setMessage("No order was found in this browser tab. Use your email and order number to look it up.");
          return;
        }
        const result = await postJson<Order>("/api/orders/lookup", { email: reference.email, order_number: reference.orderNumber });
        if (active) setOrder(result);
      } catch (error) {
        console.error("Could not check payment status:", error);
        if (active) setMessage("We couldn't check your order status. Try again or use order lookup.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void lookup();
    return () => { active = false; };
  }, [retry]);

  return (
    <main className="shop section-wrap">
      <p className="eyebrow">Your order</p>
      <h1>{order?.status === "paid" ? "Payment confirmed" : "Check your payment status"}</h1>
      {loading && <p role="status">Checking your order...</p>}
      {message && <p role="alert" className="cart-error">{message}</p>}
      {!loading && order && (
        <>
          <OrderSummary order={order} />
          <p className="shop-intro">{order.status === "paid"
            ? "Your payment has been confirmed. Your cart has not been cleared automatically."
            : "Your payment is not confirmed yet. The payment webhook may still be processing; refresh the status before trying to pay again."}</p>
        </>
      )}
      {!loading && <button type="button" className="button button-dark" onClick={() => setRetry((value) => value + 1)}>Refresh status</button>}
      <p><Link className="text-link" href="/orders">Look up an order</Link></p>
      <p><Link className="text-link" href="/cart">Return to cart</Link></p>
    </main>
  );
}
