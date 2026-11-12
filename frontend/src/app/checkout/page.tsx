import type { Metadata } from "next";

import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="container mx-auto space-y-8 px-4 py-10">
      <h1 className="text-4xl font-semibold">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
