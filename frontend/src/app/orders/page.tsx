"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { OrderSummary } from "@/components/order-summary";
import { postJson } from "@/lib/orders";
import type { Order } from "@/lib/orders";

export default function OrderLookupPage() {
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setOrder(null);
    try {
      setOrder(await postJson<Order>("/api/orders/lookup", { email, order_number: number.trim().toUpperCase() }));
    } catch (cause) {
      console.error("Order lookup failed:", cause);
      setError(cause instanceof Error ? cause.message : "Could not look up your order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shop section-wrap">
      <p className="eyebrow">Your order</p>
      <h1>Check order status</h1>
      <form className="order-form" onSubmit={lookup}>
        <label htmlFor="order-email">Email address</label>
        <input id="order-email" type="email" autoComplete="email" required maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} />
        <label htmlFor="order-number">Order number</label>
        <input id="order-number" required maxLength={28} value={number} onChange={(event) => setNumber(event.target.value)} placeholder="SON-..." />
        <button className="button button-dark" disabled={busy}>{busy ? "Looking up..." : "Find order"}</button>
      </form>
      {error && <p className="cart-error" role="alert">{error}</p>}
      {order && <OrderSummary order={order} />}
    </main>
  );
}
