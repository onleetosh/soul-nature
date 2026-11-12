import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/product/product-image";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative overflow-hidden">
        <ProductImage product={product} className="transition duration-300 group-hover:scale-[1.03]" />
        {soldOut && (
          <Badge variant="secondary" className="absolute top-3 left-3">
            Sold out
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{product.category?.name}</span>
        <h3 className="font-sans text-base font-semibold tracking-normal">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <span className="font-semibold">{formatPrice(product.price_cents)}</span>
          {product.size && <span className="text-muted-foreground">{product.size}</span>}
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border bg-card">
          <div className="aspect-square animate-pulse bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
