import type {
  Category,
  CheckoutSessionCreated,
  CheckoutSessionStatus,
  Order,
  Product,
  ProductList,
} from "@/lib/types";

const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function apiBaseUrl() {
  if (typeof window === "undefined") return process.env.API_URL ?? PUBLIC_API_URL;
  return PUBLIC_API_URL;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError("Unable to reach the store right now. Please try again shortly.", 0);
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
      else if (Array.isArray(body.detail)) detail = body.detail.map((d: { msg: string }) => d.msg).join(", ");
    } catch {
      // keep statusText
    }
    throw new ApiError(detail || "Request failed", res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type ProductQuery = {
  category?: string;
  q?: string;
  sort?: string;
  featured?: boolean;
  limit?: number;
};

export function getProducts(query: ProductQuery = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return apiFetch<ProductList>(`/api/products${qs ? `?${qs}` : ""}`);
}

export function getProductBySlug(slug: string) {
  return apiFetch<Product>(`/api/products/slug/${encodeURIComponent(slug)}`);
}

export function getCategories() {
  return apiFetch<Category[]>("/api/categories");
}

export function createCheckoutSession(payload: {
  email?: string;
  items: { product_id: number; quantity: number }[];
}) {
  return apiFetch<CheckoutSessionCreated>("/api/checkout/session", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCheckoutSessionStatus(sessionId: string) {
  return apiFetch<CheckoutSessionStatus>(`/api/checkout/session/${encodeURIComponent(sessionId)}`);
}

export function lookupOrder(email: string, orderNumber: string) {
  const params = new URLSearchParams({ email: email.trim(), order_number: orderNumber.trim() });
  return apiFetch<Order>(`/api/orders/lookup?${params}`);
}
