"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { items, ready, error } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <div className="announcement">
        <p>Rooted in nature. Made for your everyday ritual.</p>
      </div>
      <header className="site-header">
        <a className="wordmark" href="/#home" aria-label="Soul of Nature home">
          <span className="wordmark-icon" aria-hidden="true">s</span>
          <span>SOUL <span className="wordmark-of">OF</span> NATURE</span>
        </a>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="primary-navigation"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
        </button>
        <nav
          className={`navigation${open ? " is-open" : ""}`}
          id="primary-navigation"
          aria-label="Main navigation"
          onClick={() => setOpen(false)}
        >
          <a href="/shop">Shop</a>
          <a href="/orders">Order status</a>
          <a href="/about">Our story</a>
          <a href="/#promise">Our promise</a>
        </nav>
        <a className="header-cart" href="/cart" aria-label={ready && !error ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}>
          Cart{ready && !error ? ` (${count})` : ""}
        </a>
        <a className="header-cta" href="/shop">
          Find your ritual <span aria-hidden="true">↗</span>
        </a>
      </header>
    </>
  );
}
