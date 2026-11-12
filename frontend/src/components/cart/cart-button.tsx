"use client";

import Link from "next/link";
import { ShoppingBagIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";

export function CartButton() {
  const { count } = useCart();
  return (
    <Button asChild variant="ghost" size="icon-lg" className="relative">
      <Link href="/cart" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}>
        <ShoppingBagIcon className="size-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand-clay px-1 text-[0.7rem] font-semibold text-white">
            {count}
          </span>
        )}
      </Link>
    </Button>
  );
}
