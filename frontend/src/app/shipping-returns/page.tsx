import type { Metadata } from "next";
import Link from "next/link";

import { formatPrice } from "@/lib/format";
import { FLAT_SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = { title: "Shipping & returns" };

export default function ShippingReturnsPage() {
  return (
    <article className="container mx-auto max-w-3xl space-y-10 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold">Shipping &amp; returns</h1>
        <p className="text-muted-foreground">Everything you need to know about getting your order — and sending it back.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Shipping</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Free standard shipping</strong> on orders of{" "}
            {formatPrice(FREE_SHIPPING_THRESHOLD_CENTS)} or more. Orders under that ship for a flat{" "}
            {formatPrice(FLAT_SHIPPING_CENTS)}.
          </li>
          <li>We currently ship within the United States.</li>
          <li>Orders are packed and shipped within 1–2 business days. Standard delivery takes 3–7 business days.</li>
          <li>
            Once your order ships, you can follow its progress on the{" "}
            <Link href="/orders" className="underline">
              order status
            </Link>{" "}
            page using your email and order number.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Returns</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            Not feeling it? Return unopened products within <strong className="text-foreground">30 days</strong> of
            delivery for a full refund.
          </li>
          <li>
            Opened a product and it didn&apos;t agree with your skin? Let us know within 30 days — we&apos;ll make it
            right with an exchange or store credit.
          </li>
          <li>Refunds are issued to your original payment method within 5–10 business days of receiving your return.</li>
          <li>Return shipping is free for damaged or incorrect items.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">How to start a return</h2>
        <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
          <li>
            Email{" "}
            <a href={`mailto:${siteConfig.email}`} className="underline">
              {siteConfig.email}
            </a>{" "}
            with your order number and the items you&apos;d like to return.
          </li>
          <li>We&apos;ll reply with a prepaid label (where applicable) and instructions.</li>
          <li>Pack the items securely and drop them off with the carrier.</li>
        </ol>
      </section>

      <p className="rounded-xl bg-muted p-6 text-sm text-muted-foreground">
        Questions? <Link href="/contact" className="underline">Get in touch</Link> — we&apos;re happy to help.
      </p>
    </article>
  );
}
