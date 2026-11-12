import { Suspense } from "react";
import type { Metadata } from "next";

import { OrderLookup } from "@/components/orders/order-lookup";

export const metadata: Metadata = { title: "Order status" };

export default function OrdersPage() {
  return (
    <div className="container mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold">Order status</h1>
        <p className="text-muted-foreground">
          Enter the email you used at checkout and the order number from your confirmation.
        </p>
      </div>
      <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-muted" />}>
        <OrderLookup />
      </Suspense>
    </div>
  );
}
