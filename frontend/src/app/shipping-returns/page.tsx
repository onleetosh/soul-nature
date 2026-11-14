import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping & returns | Soul of Nature",
  description: "Shipping and returns information for Soul of Nature.",
};

export default function ShippingReturnsPage() {
  return (
    <main className="shop section-wrap info-page">
      <p className="eyebrow">Good to know</p>
      <h1>Shipping &amp; returns</h1>
      <p className="info-lead">
        Our shipping and returns policies have not been published yet. This
        local storefront is still in development.
      </p>
      <section>
        <h2>Shipping</h2>
        <p>Shipping options, rates, and delivery times are not configured.</p>
      </section>
      <section>
        <h2>Returns and refunds</h2>
        <p>Return eligibility, instructions, and refund details are not configured.</p>
      </section>
      <Link className="text-link" href="/contact">Contact information</Link>
    </main>
  );
}
