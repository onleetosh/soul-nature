"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCheckoutSessionStatus } from "@/lib/api";
import { clearCart } from "@/lib/cart";
import type { CheckoutSessionStatus } from "@/lib/types";

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 15;

export function CheckoutSuccess() {
  const sessionId = useSearchParams().get("session_id");
  const [status, setStatus] = useState<CheckoutSessionStatus | null>(null);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    clearCart();
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    async function poll() {
      attempts += 1;
      try {
        const result = await getCheckoutSessionStatus(sessionId!);
        if (cancelled) return;
        setStatus(result);
        if (result.status === "complete") return;
      } catch {
        // retry below
      }
      if (attempts >= MAX_ATTEMPTS) setGaveUp(true);
      else timer = setTimeout(poll, POLL_INTERVAL_MS);
    }
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="text-center">
        <p>We couldn&apos;t find your checkout session.</p>
        <Button asChild className="mt-4">
          <Link href="/orders">Look up an order</Link>
        </Button>
      </div>
    );
  }

  const complete = status?.status === "complete";

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
      {complete ? (
        <CheckCircle2Icon className="size-14 text-primary" />
      ) : (
        <Loader2Icon className="size-14 animate-spin text-muted-foreground" />
      )}
      <h1 className="text-3xl font-semibold sm:text-4xl">
        {complete ? "Thank you for your order!" : "Confirming your payment…"}
      </h1>
      {complete ? (
        <>
          <p className="text-muted-foreground">
            Your order <span className="font-semibold text-foreground">{status.order_number}</span> is confirmed. A
            receipt is on its way to <span className="font-medium text-foreground">{status.email}</span>.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link
                href={`/orders?email=${encodeURIComponent(status.email ?? "")}&order_number=${encodeURIComponent(status.order_number ?? "")}`}
              >
                View order status
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/products">Keep shopping</Link>
            </Button>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">
          {gaveUp
            ? "Your payment went through, but we're still finalizing your order. Check your email for your order number, or look it up in a few minutes."
            : "Hang tight — this usually takes just a few seconds."}
        </p>
      )}
      {gaveUp && !complete && (
        <Button asChild variant="outline">
          <Link href="/orders">Look up my order</Link>
        </Button>
      )}
    </div>
  );
}
