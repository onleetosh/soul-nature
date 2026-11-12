"use client";

import Link from "next/link";
import { ShoppingBagIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QuantitySelector } from "@/components/cart/quantity-selector";
import { ProductImage } from "@/components/product/product-image";
import { removeFromCart, updateQuantity, useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { estimateShipping, FREE_SHIPPING_THRESHOLD_CENTS, MAX_QUANTITY_PER_ITEM } from "@/lib/shipping";

export function CartView({ checkoutAction }: { checkoutAction?: React.ReactNode }) {
  const { items, ready, subtotalCents } = useCart();

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-12 text-center">
        <ShoppingBagIcon className="size-10 text-muted-foreground" />
        <div>
          <p className="text-lg font-medium">Your cart is empty</p>
          <p className="text-sm text-muted-foreground">Find something good for your soul.</p>
        </div>
        <Button asChild>
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  const shipping = estimateShipping(subtotalCents);
  const remaining = FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <ul className="divide-y rounded-xl border bg-card">
        {items.map((line) => (
          <li key={line.productId} className="flex gap-4 p-4">
            <Link href={`/products/${line.slug}`} className="w-20 shrink-0 overflow-hidden rounded-lg sm:w-24">
              <ProductImage
                product={{
                  name: line.name,
                  image_url: line.imageUrl,
                  size: "",
                  category: line.categorySlug
                    ? { id: 0, slug: line.categorySlug, name: line.categoryName ?? "", description: "" }
                    : null,
                }}
                className="[&_span]:hidden [&_svg]:size-8"
              />
            </Link>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link href={`/products/${line.slug}`} className="font-medium hover:underline">
                  {line.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {[line.size, formatPrice(line.priceCents)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <QuantitySelector
                  value={line.quantity}
                  onChange={(value) => updateQuantity(line.productId, value)}
                  max={Math.min(line.stock, MAX_QUANTITY_PER_ITEM)}
                  label={`Quantity for ${line.name}`}
                />
                <span className="w-20 text-right font-semibold">{formatPrice(line.priceCents * line.quantity)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${line.name}`}
                  onClick={() => removeFromCart(line.productId)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit space-y-4 rounded-xl border bg-card p-6 lg:sticky lg:top-28">
        <h2 className="text-xl font-semibold">Order summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatPrice(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
          </div>
        </dl>
        {remaining > 0 && (
          <p className="rounded-md bg-secondary p-3 text-xs">
            Add {formatPrice(remaining)} more for free shipping.
          </p>
        )}
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Estimated total</span>
          <span>{formatPrice(subtotalCents + shipping)}</span>
        </div>
        {checkoutAction}
        <p className="text-center text-xs text-muted-foreground">Taxes calculated at checkout.</p>
      </aside>
    </div>
  );
}
