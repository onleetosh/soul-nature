"use client";

import { useSyncExternalStore } from "react";

import { apiFetch } from "@/lib/api";
import type { Order, OrderStatus, Product } from "@/lib/types";

const TOKEN_KEY = "soul-of-nature-admin-token";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readToken() {
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string | null) {
  if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
  else window.sessionStorage.removeItem(TOKEN_KEY);
  listeners.forEach((listener) => listener());
}

/** Returns `undefined` during SSR / before hydration, `null` when signed out. */
export function useAdminToken() {
  return useSyncExternalStore<string | null | undefined>(subscribe, readToken, () => undefined);
}

function adminFetch<T>(token: string, path: string, init: RequestInit = {}) {
  return apiFetch<T>(`/api/admin${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  });
}

export type ProductInput = {
  name: string;
  slug: string;
  description: string;
  ingredients: string;
  size: string;
  price_cents: number;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  category_id: number;
};

export const adminApi = {
  listProducts: (token: string) => adminFetch<Product[]>(token, "/products"),
  createProduct: (token: string, body: ProductInput) =>
    adminFetch<Product>(token, "/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (token: string, id: number, body: Partial<ProductInput>) =>
    adminFetch<Product>(token, `/products/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteProduct: (token: string, id: number) => adminFetch<void>(token, `/products/${id}`, { method: "DELETE" }),
  listOrders: (
    token: string,
    params: { status?: OrderStatus; q?: string; limit?: number; offset?: number } = {},
  ) => {
    const search = new URLSearchParams();
    if (params.status) search.set("status", params.status);
    if (params.q) search.set("q", params.q);
    search.set("limit", String(params.limit ?? 100));
    if (params.offset) search.set("offset", String(params.offset));
    return adminFetch<{ items: Order[]; total: number }>(token, `/orders?${search}`);
  },
  updateOrderStatus: (token: string, id: number, status: OrderStatus) =>
    adminFetch<Order>(token, `/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
};
