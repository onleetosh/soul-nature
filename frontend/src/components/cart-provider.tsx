"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type CartItem = { productId: number; quantity: number };

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  error: string | null;
  storageBlocked: boolean;
  addItem: (productId: number, stock: number) => boolean;
  setQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  resetCart: () => void;
};

const storageKey = "soul-nature-cart";
const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartItem[] {
  const stored = localStorage.getItem(storageKey);
  if (stored === null) return [];
  const value: unknown = JSON.parse(stored);
  if (!Array.isArray(value) || value.length > 50) throw new Error("Invalid cart");
  const seen = new Set<number>();
  return value.map((item: unknown) => {
    if (
      typeof item !== "object" || item === null ||
      !("productId" in item) || typeof item.productId !== "number" ||
      !Number.isSafeInteger(item.productId) || item.productId < 1 ||
      !("quantity" in item) || typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99 ||
      seen.has(item.productId)
    ) {
      throw new Error("Invalid cart item");
    }
    seen.add(item.productId);
    return { productId: item.productId, quantity: item.quantity };
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageBlocked, setStorageBlocked] = useState(false);

  const load = useCallback(() => {
    try {
      setItems(readCart());
      setError(null);
      setStorageBlocked(false);
    } catch (cause) {
      console.error("Could not read the cart:", cause);
      setError("Your saved cart could not be read. Check browser storage or reset your cart.");
      setStorageBlocked(true);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    load();
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [load]);

  function update(change: (current: CartItem[]) => CartItem[]): boolean {
    if (!ready) return false;
    try {
      const current = readCart();
      const next = change(current);
      localStorage.setItem(storageKey, JSON.stringify(next));
      setItems(next);
      setError(null);
      setStorageBlocked(false);
      return true;
    } catch (cause) {
      console.error("Could not update the cart:", cause);
      setError(cause instanceof CartLimitError ? cause.message : "Your cart could not be saved. Check browser storage or reset your cart.");
      setStorageBlocked(!(cause instanceof CartLimitError));
      return false;
    }
  }

  function addItem(productId: number, stock: number): boolean {
    return update((current) => {
      const existing = current.find((item) => item.productId === productId);
      if ((existing?.quantity ?? 0) >= Math.min(stock, 99)) {
        throw new CartLimitError("You have reached the available quantity for this product.");
      }
      if (!existing && current.length >= 50) {
        throw new CartLimitError("Your cart can contain at most 50 different products.");
      }
      return existing
        ? current.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { productId, quantity: 1 }];
    });
  }

  function setQuantity(productId: number, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return;
    update((current) => current.map((item) => item.productId === productId ? { ...item, quantity } : item));
  }

  function removeItem(productId: number) {
    update((current) => current.filter((item) => item.productId !== productId));
  }

  function resetCart() {
    try {
      localStorage.removeItem(storageKey);
      setItems([]);
      setError(null);
      setStorageBlocked(false);
    } catch (cause) {
      console.error("Could not reset the cart:", cause);
      setError("Your cart could not be reset. Check browser storage.");
      setStorageBlocked(true);
    }
  }

  return (
    <CartContext.Provider value={{ items, ready, error, storageBlocked, addItem, setQuantity, removeItem, resetCart }}>
      {children}
    </CartContext.Provider>
  );
}

class CartLimitError extends Error {}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
