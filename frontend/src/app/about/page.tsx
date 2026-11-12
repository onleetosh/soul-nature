import type { Metadata } from "next";
import Link from "next/link";
import { HandHeartIcon, LeafIcon, SproutIcon, UsersIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Our Story",
  description: "Soul of Nature is a Black-owned brand crafting natural grooming and wellness essentials.",
};

const values = [
  {
    icon: LeafIcon,
    title: "Plant-powered",
    body: "Shea, cocoa butter, African black soap, botanical oils — ingredients our grandparents trusted, with nothing you can't pronounce.",
  },
  {
    icon: HandHeartIcon,
    title: "Made for us",
    body: "Formulated for coarse, curly beards and melanin-rich skin that too many mainstream brands overlook.",
  },
  {
    icon: UsersIcon,
    title: "Community first",
    body: "A portion of every order supports barbershop wellness programs and Black-owned farms that grow our botanicals.",
  },
  {
    icon: SproutIcon,
    title: "Small batch",
    body: "We blend in small runs so every bottle and tin is fresh, potent, and made with intention.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-3xl space-y-6 px-4 py-16 text-center sm:py-24">
          <p className="text-sm font-medium tracking-widest text-brand-gold uppercase">Our story</p>
          <h1 className="font-heading text-4xl font-semibold sm:text-5xl">Self-care is a ritual. We make it ours.</h1>
          <p className="text-lg text-primary-foreground/80">
            Soul of Nature is a Black-owned wellness and men&apos;s grooming brand built on a simple belief: taking care
            of yourself is an act of pride, not vanity.
          </p>
        </div>
      </section>

      <section className="container mx-auto grid max-w-5xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center">
        <div className="space-y-4 text-muted-foreground">
          <h2 className="font-heading text-3xl font-semibold text-foreground">Rooted in the barbershop</h2>
          <p>
            Our founder grew up sweeping floors in his uncle&apos;s barbershop, where Saturday mornings meant hot
            towels, real conversation, and remedies passed down from back home. Those rituals taught him that grooming
            is about more than looking sharp — it&apos;s how we show up for ourselves and each other.
          </p>
          <p>
            Years later, frustrated by shelves of products full of harsh fillers that left his beard dry and skin
            irritated, he started blending his own oils and balms in his kitchen. Friends asked for batches. Then their
            friends did. Soul of Nature was born.
          </p>
          <p>
            Today we craft grooming, personal-care, fragrance, and wellness essentials from natural ingredients — made
            for melanin-rich skin and textured hair, and made for anyone who wants to slow down and care for themselves
            with intention.
          </p>
        </div>
        <div className="aspect-square rounded-3xl bg-gradient-to-br from-brand-gold/40 via-accent to-primary/40" aria-hidden />
      </section>

      <section className="bg-muted/50">
        <div className="container mx-auto max-w-5xl space-y-10 px-4 py-16">
          <h2 className="text-center font-heading text-3xl font-semibold">What we stand for</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, body }) => (
              <div key={title} className="space-y-3 rounded-xl border bg-card p-6">
                <Icon className="size-6 text-primary" />
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-2xl space-y-4 px-4 py-16 text-center">
        <h2 className="font-heading text-3xl font-semibold">Start your ritual</h2>
        <p className="text-muted-foreground">Find the beard oil, balm, or blend that fits your routine.</p>
        <Button asChild size="lg">
          <Link href="/products">Shop the collection</Link>
        </Button>
      </section>
    </div>
  );
}
