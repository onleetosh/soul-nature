"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBagIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/cart/quantity-selector";
import { addToCart, useCart } from "@/lib/cart";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/shipping";
import type { Product } from "@/lib/types";

export function AddToCart({ product }: { product: Product }) {
  const router = useRouter();
  const { quantityOf } = useCart();
  const [quantity, setQuantity] = useState(1);
  const inCart = quantityOf(product.id);
  const available = Math.max(0, Math.min(product.stock, MAX_QUANTITY_PER_ITEM) - inCart);

  if (product.stock <= 0) {
    return (
      <Button size="lg" disabled className="w-full sm:w-auto">
        Sold out
      </Button>
    );
  }

  function handleAdd() {
    addToCart(product, quantity);
    setQuantity(1);
    toast.success(`${product.name} added to your cart`, {
      action: { label: "View cart", onClick: () => router.push("/cart") },
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <QuantitySelector value={Math.min(quantity, Math.max(available, 1))} onChange={setQuantity} max={available} />
        <Button size="lg" onClick={handleAdd} disabled={available === 0} className="flex-1 sm:flex-none">
          <ShoppingBagIcon /> Add to cart
        </Button>
      </div>
      {inCart > 0 && (
        <p className="text-sm text-muted-foreground">
          {inCart} in your cart &middot;{" "}
          <Link href="/cart" className="underline">
            View cart
          </Link>
        </p>
      )}
    </div>
  );
}
