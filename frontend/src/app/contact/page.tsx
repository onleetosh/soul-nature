import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | Soul of Nature",
  description: "Contact information and order help for Soul of Nature.",
};

export default function ContactPage() {
  return (
    <main className="shop section-wrap info-page">
      <p className="eyebrow">Here to help</p>
      <h1>Contact us</h1>
      <p className="info-lead">
        Our contact details are not available yet. This local storefront is
        still in development.
      </p>
      <section>
        <h2>Checking an order?</h2>
        <p>You can look up an order using the email and order number you used at checkout.</p>
        <Link className="text-link" href="/orders">Check order status</Link>
      </section>
    </main>
  );
}
