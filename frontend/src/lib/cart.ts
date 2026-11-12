"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { MAX_QUANTITY_PER_ITEM } from "@/lib/shipping";
import type { Product } from "@/lib/types";

export type CartLine = {
  productId: number;
  slug: string;
  name: string;
  priceCents: number;
  size: string;
  imageUrl: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  stock: number;
  quantity: number;
};

const STORAGE_KEY = "soul-of-nature-cart-v1";
const EMPTY: CartLine[] = [];

let lines: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function isCartLine(value: unknown): value is CartLine {
  const line = value as CartLine;
  return (
    typeof line === "object" &&
    line !== null &&
    typeof line.productId === "number" &&
    typeof line.name === "string" &&
    typeof line.priceCents === "number" &&
    typeof line.quantity === "number" &&
    line.quantity > 0
  );
}

function readStorage(): CartLine[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isCartLine) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    lines = readStorage();
    loaded = true;
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function setLines(next: CartLine[]) {
  lines = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage may be unavailable (private mode); keep in-memory state
  }
  emit();
}

function onStorage(event: StorageEvent) {
  if (event.key === STORAGE_KEY) {
    lines = readStorage();
    emit();
  }
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  ensureLoaded();
  return lines;
}

function getServerSnapshot() {
  return EMPTY;
}

function clampQuantity(quantity: number, stock: number) {
  return Math.max(0, Math.min(quantity, stock, MAX_QUANTITY_PER_ITEM));
}

export function addToCart(product: Product, quantity = 1) {
  ensureLoaded();
  const existing = lines.find((line) => line.productId === product.id);
  if (existing) {
    updateQuantity(product.id, existing.quantity + quantity);
    return;
  }
  const line: CartLine = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    priceCents: product.price_cents,
    size: product.size,
    imageUrl: product.image_url,
    categorySlug: product.category?.slug ?? null,
    categoryName: product.category?.name ?? null,
    stock: product.stock,
    quantity: clampQuantity(quantity, product.stock),
  };
  if (line.quantity > 0) setLines([...lines, line]);
}

export function updateQuantity(productId: number, quantity: number) {
  ensureLoaded();
  setLines(
    lines
      .map((line) =>
        line.productId === productId ? { ...line, quantity: clampQuantity(quantity, line.stock) } : line,
      )
      .filter((line) => line.quantity > 0),
  );
}

export function removeFromCart(productId: number) {
  ensureLoaded();
  setLines(lines.filter((line) => line.productId !== productId));
}

export function clearCart() {
  setLines(EMPTY);
}

const noopSubscribe = () => () => {};

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const totals = useMemo(
    () => ({
      count: items.reduce((sum, line) => sum + line.quantity, 0),
      subtotalCents: items.reduce((sum, line) => sum + line.quantity * line.priceCents, 0),
    }),
    [items],
  );
  const quantityOf = useCallback(
    (productId: number) => items.find((line) => line.productId === productId)?.quantity ?? 0,
    [items],
  );
  return { items, ready, quantityOf, ...totals };
}
