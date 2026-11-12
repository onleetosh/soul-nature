import type { Metadata } from "next";
import Link from "next/link";
import { ClockIcon, MailIcon, PackageSearchIcon } from "lucide-react";

import { ContactForm } from "@/components/contact/contact-form";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  return (
    <div className="container mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-[1fr_1.4fr]">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold">Contact us</h1>
          <p className="text-muted-foreground">
            Questions about a product, your routine, or an order? We&apos;re a small team and we read every message.
          </p>
        </div>
        <ul className="space-y-4 text-sm">
          <li className="flex gap-3">
            <MailIcon className="size-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Email</p>
              <a href={`mailto:${siteConfig.email}`} className="text-muted-foreground underline">
                {siteConfig.email}
              </a>
            </div>
          </li>
          <li className="flex gap-3">
            <ClockIcon className="size-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Response time</p>
              <p className="text-muted-foreground">Within 1–2 business days, Monday–Friday.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <PackageSearchIcon className="size-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Where&apos;s my order?</p>
              <p className="text-muted-foreground">
                Check{" "}
                <Link href="/orders" className="underline">
                  order status
                </Link>{" "}
                or our{" "}
                <Link href="/shipping-returns" className="underline">
                  shipping &amp; returns
                </Link>{" "}
                policy.
              </p>
            </div>
          </li>
        </ul>
      </div>
      <ContactForm />
    </div>
  );
}
