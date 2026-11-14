import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our story | Soul of Nature",
  description: "Get to know Soul of Nature and our approach to everyday care.",
};

export default function AboutPage() {
  return (
    <main className="shop section-wrap info-page">
      <p className="eyebrow">The soul in the everyday</p>
      <h1>Care that feels like coming home.</h1>
      <p className="info-lead">
        Soul of Nature is a Black-owned wellness and men&apos;s grooming brand
        grounded in the belief that caring for yourself can bring you closer
        to the natural world—and to who you are.
      </p>
      <section>
        <h2>Our approach</h2>
        <p>
          We&apos;re building a more thoughtful approach to the things you reach
          for every day—rooted in care for yourself, your community, and the
          world around you.
        </p>
        <p>
          From grooming and fragrance to wellness, our collections are
          inspired by everyday rituals and making a little room for yourself.
        </p>
      </section>
      <Link className="button button-dark" href="/shop">Explore the shop</Link>
    </main>
  );
}
