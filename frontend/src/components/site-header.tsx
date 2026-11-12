"use client";

import { useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

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
          <a href="/#collections">Shop</a>
          <a href="/#story">Our story</a>
          <a href="/#promise">Our promise</a>
        </nav>
        <a className="header-cta" href="/#collections">
          Find your ritual <span aria-hidden="true">↗</span>
        </a>
      </header>
    </>
  );
}
