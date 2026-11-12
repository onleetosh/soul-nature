import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon, LeafIcon, TruckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { AddToCart } from "@/components/cart/add-to-cart";
import { Separator } from "@/components/ui/separator";
import { ProductImage } from "@/components/product/product-image";
import { ApiError, getProductBySlug } from "@/lib/api";
import { formatPrice } from "@/lib/format";

async function loadProduct(slug: string) {
  try {
    return await getProductBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    return { title: product.name, description: product.description };
  } catch {
    return { title: "Product" };
  }
}

async function ProductDetail({ params }: { params: PageProps<"/products/[slug]">["params"] }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  const soldOut = product.stock <= 0;

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
      <div className="overflow-hidden rounded-2xl border">
        <ProductImage product={product} />
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          {product.category && (
            <Link
              href={`/products?category=${product.category.slug}`}
              className="text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="text-3xl font-semibold sm:text-4xl">{product.name}</h1>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold">{formatPrice(product.price_cents)}</span>
            {product.size && <span className="text-muted-foreground">{product.size}</span>}
            {soldOut ? (
              <Badge variant="secondary">Sold out</Badge>
            ) : product.stock < 10 ? (
              <Badge variant="outline">Only {product.stock} left</Badge>
            ) : null}
          </div>
        </div>
        <p className="leading-relaxed text-muted-foreground">{product.description}</p>
        <AddToCart product={product} />
        <Separator />
        {product.ingredients && (
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 font-sans text-sm font-semibold tracking-normal">
              <LeafIcon className="size-4 text-primary" /> Ingredients
            </h2>
            <p className="text-sm text-muted-foreground">{product.ingredients}</p>
          </div>
        )}
        <div className="flex items-start gap-2 rounded-lg bg-secondary p-4 text-sm">
          <TruckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            Free shipping on orders over $75. Ships in 1–2 business days.{" "}
            <Link href="/shipping-returns" className="underline">
              Shipping &amp; returns
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
      <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
      <div className="space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/products" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeftIcon className="size-4" /> Back to shop
      </Link>
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}
