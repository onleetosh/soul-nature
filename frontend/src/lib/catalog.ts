export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url: string | null;
  stock_quantity: number;
  category: Category;
};

const apiBase = process.env.API_BASE_URL || "http://127.0.0.1:8000";

async function get<T>(path: string): Promise<T> {
  const response = await fetch(new URL(path, apiBase), {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`Catalog API ${path} returned ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function getCategories(): Promise<Category[]> {
  return get<Category[]>("/api/v1/categories");
}

export function getProducts(category: string | undefined, offset: number): Promise<Product[]> {
  const params = new URLSearchParams({ limit: "21", offset: String(offset) });
  if (category) params.set("category", category);
  return get<Product[]>(`/api/v1/products?${params}`);
}

export async function getProduct(id: string): Promise<Product | null> {
  const response = await fetch(new URL(`/api/v1/products/${id}`, apiBase), {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Catalog API product ${id} returned ${response.status}`);
  }
  return response.json() as Promise<Product>;
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
