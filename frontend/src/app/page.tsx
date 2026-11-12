import Link from "next/link";
import { ArrowRightIcon, DropletsIcon, FlowerIcon, LeafIcon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

const categories = [
  { slug: "grooming", name: "Grooming", icon: SparklesIcon, blurb: "Beard oils, balms & shave care" },
  { slug: "personal-care", name: "Personal Care", icon: DropletsIcon, blurb: "Body bars, lotion & deodorant" },
  { slug: "fragrance", name: "Fragrance", icon: FlowerIcon, blurb: "Earthy colognes & oils" },
  { slug: "wellness", name: "Wellness", icon: LeafIcon, blurb: "Teas, aromatherapy & rituals" },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,oklch(0.74_0.13_75/0.35),transparent_55%)]" />
        <div className="container relative mx-auto grid gap-8 px-4 py-20 md:py-28">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-gold">Black-owned &middot; Plant-powered</p>
          <h1 className="max-w-2xl text-4xl font-semibold sm:text-5xl md:text-6xl">{siteConfig.tagline}</h1>
          <p className="max-w-xl text-lg text-primary-foreground/80">
            Small-batch grooming, personal care, fragrance, and wellness essentials made with ingredients our
            grandparents trusted.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-brand-gold text-foreground hover:bg-brand-gold/90">
              <Link href="/products">
                Shop the collection <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent">
              <Link href="/about">Our story</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-8 text-3xl font-semibold">Shop by category</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ slug, name, icon: Icon, blurb }) => (
            <Link
              key={slug}
              href={`/products?category=${slug}`}
              className="group rounded-xl border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Icon className="mb-4 size-8 text-primary" />
              <h3 className="text-xl font-semibold">{name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Explore <ArrowRightIcon className="size-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
