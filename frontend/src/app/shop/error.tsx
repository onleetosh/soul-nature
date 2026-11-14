"use client";

import { useEffect } from "react";

export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Could not load the catalog:", error);
  }, [error]);

  return (
    <main className="shop section-wrap">
      <h1>We couldn&apos;t load the shop.</h1>
      <p className="shop-intro">Please check that the API is running, then try again.</p>
      <button className="button button-dark" onClick={reset}>Try again</button>
    </main>
  );
}
