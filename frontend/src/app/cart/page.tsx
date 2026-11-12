import type { Metadata } from "next";

import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <div className="container mx-auto space-y-8 px-4 py-10">
      <h1 className="text-4xl font-semibold">Your cart</h1>
      <CartView />
    </div>
  );
}
