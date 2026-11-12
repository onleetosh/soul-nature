"use client";

import { useState } from "react";
import Link from "next/link";
import { LockIcon, Loader2Icon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createCheckoutSession } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { estimateShipping } from "@/lib/shipping";

export function CheckoutForm() {
  const { items, ready, subtotalCents } = useCart();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!ready) return <div className="h-80 animate-pulse rounded-xl bg-muted" />;

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="font-medium">Your cart is empty.</p>
        <Button asChild className="mt-4">
          <Link href="/products">Shop products</Link>
        </Button>
      </div>
    );
  }

  const shipping = estimateShipping(subtotalCents);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const session = await createCheckoutSession({
        email: email.trim() || undefined,
        items: items.map((line) => ({ product_id: line.productId, quantity: line.quantity })),
      });
      window.location.assign(session.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong starting checkout.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border bg-card p-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-sm text-muted-foreground">
            Checking out as a guest. We&apos;ll email your receipt and order number here.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Shipping address and payment details are collected securely by Stripe on the next step.
        </p>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? <Loader2Icon className="animate-spin" /> : <LockIcon />}
          {submitting ? "Redirecting to Stripe…" : `Pay ${formatPrice(subtotalCents + shipping)} with Stripe`}
        </Button>
      </form>

      <aside className="h-fit space-y-4 rounded-xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Your order</h2>
        <ul className="space-y-3 text-sm">
          {items.map((line) => (
            <li key={line.productId} className="flex justify-between gap-4">
              <span>
                {line.name} <span className="text-muted-foreground">× {line.quantity}</span>
              </span>
              <span>{formatPrice(line.priceCents * line.quantity)}</span>
            </li>
          ))}
        </ul>
        <Separator />
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatPrice(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(subtotalCents + shipping)}</dd>
          </div>
        </dl>
        <Link href="/cart" className="block text-center text-sm text-muted-foreground underline">
          Edit cart
        </Link>
      </aside>
    </div>
  );
}
