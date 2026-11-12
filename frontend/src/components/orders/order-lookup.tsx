"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2Icon, SearchIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrderDetails } from "@/components/orders/order-details";
import { lookupOrder } from "@/lib/api";
import type { Order } from "@/lib/types";

export function OrderLookup() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const initialNumber = searchParams.get("order_number") ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [orderNumber, setOrderNumber] = useState(initialNumber);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(initialEmail && initialNumber));

  const search = useCallback(async (emailValue: string, numberValue: string) => {
    setLoading(true);
    setError(null);
    try {
      setOrder(await lookupOrder(emailValue, numberValue));
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : "Could not look up that order.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialEmail || !initialNumber) return;
    let cancelled = false;
    lookupOrder(initialEmail, initialNumber)
      .then((result) => !cancelled && setOrder(result))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Could not look up that order."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [initialEmail, initialNumber]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void search(email, orderNumber);
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border bg-card p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="lookup-email">Email</Label>
          <Input
            id="lookup-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lookup-number">Order number</Label>
          <Input
            id="lookup-number"
            required
            placeholder="SON-XXXXXXXX"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2Icon className="animate-spin" /> : <SearchIcon />} Find order
        </Button>
      </form>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {order && <OrderDetails order={order} />}
    </div>
  );
}
