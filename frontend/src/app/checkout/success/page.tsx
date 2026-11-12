import { Suspense } from "react";
import type { Metadata } from "next";

import { CheckoutSuccess } from "@/components/checkout/checkout-success";

export const metadata: Metadata = { title: "Order confirmed" };

export default function CheckoutSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <Suspense fallback={<div className="mx-auto h-48 max-w-lg animate-pulse rounded-xl bg-muted" />}>
        <CheckoutSuccess />
      </Suspense>
    </div>
  );
}
