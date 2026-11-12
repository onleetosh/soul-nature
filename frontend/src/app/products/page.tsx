import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-card";
import { SortSelect } from "@/components/product/sort-select";
import { getCategories, getProducts } from "@/lib/api";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop",
  description: "Natural grooming, personal care, fragrance, and wellness products.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function CategoryFilters({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const active = first(params.category);
  const categories = await getCategories().catch(() => []);
  const chips = [{ slug: undefined, name: "All" }, ...categories];
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((category) => (
        <Link
          key={category.slug ?? "all"}
          href={category.slug ? `/products?category=${category.slug}` : "/products"}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm transition",
            active === category.slug ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
          )}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}

async function SearchBox({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const category = first(params.category);
  return (
    <form action="/products" className="relative w-full sm:w-64">
      {category && <input type="hidden" name="category" value={category} />}
      <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input name="q" defaultValue={first(params.q) ?? ""} placeholder="Search products" className="pl-9" />
    </form>
  );
}

async function ProductResults({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = { category: first(params.category), q: first(params.q), sort: first(params.sort) };
  const { items, total } = await getProducts({ ...query, limit: 100 });

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="font-medium">No products found.</p>
        <Link href="/products" className="mt-2 inline-block text-sm text-primary underline">
          Clear filters
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {total} product{total === 1 ? "" : "s"}
      </p>
      <ProductGrid products={items} />
    </div>
  );
}

export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <div className="container mx-auto space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold">Shop the collection</h1>
        <p className="text-muted-foreground">Clean ingredients. Bold results. Made for the culture.</p>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Suspense fallback={<div className="h-9" />}>
          <CategoryFilters searchParams={searchParams} />
        </Suspense>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Suspense fallback={<div className="h-9 w-64" />}>
            <SearchBox searchParams={searchParams} />
          </Suspense>
          <Suspense fallback={<div className="h-9 w-48" />}>
            <SortSelect />
          </Suspense>
        </div>
      </div>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
