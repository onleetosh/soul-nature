"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";

export function AddToCart({ productId, stock }: { productId: number; stock: number }) {
  const { addItem, ready, error } = useCart();
  const [added, setAdded] = useState(false);

  function add() {
    setAdded(addItem(productId, stock));
  }

  return (
    <div className="add-to-cart">
      <button type="button" className="button button-dark" onClick={add} disabled={!ready || stock === 0}>
        {stock === 0 ? "Out of stock" : "Add to cart"}
      </button>
      {error && <p className="cart-error" role="alert">{error} <Link href="/cart">View cart</Link></p>}
      {added && !error && <p role="status">Added to your cart. <Link href="/cart">View cart</Link></p>}
    </div>
  );
}
