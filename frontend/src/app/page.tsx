import { Button } from "@/components/ui/button";

const collections = [
  {
    className: "collection-beard",
    image: "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=900&q=85",
    alt: "A considered men's grooming ritual",
    number: "01 / THE DAILY RITUAL",
    title: "Beard & grooming",
    category: "grooming",
  },
  {
    className: "collection-wellness",
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85",
    alt: "Natural personal-care products arranged on a warm surface",
    number: "02 / MAKE SPACE",
    title: "Body & wellness",
    category: "wellness",
  },
  {
    className: "collection-scent",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=85",
    alt: "A warm, intimate fragrance display",
    number: "03 / LEAVE A LITTLE TRACE",
    title: "Fragrance",
    category: "fragrance",
  },
];

export default function Home() {
  return (
    <main>
      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> A more intentional kind of care</p>
          <h1>Come back<br />to <span>yourself.</span></h1>
          <p className="hero-description">
            Everyday care inspired by the earth, created to make a little room
            for you.
          </p>
          <Button asChild className="button button-dark">
            <a href="#collections">
              Discover your ritual <span aria-hidden="true">↗</span>
            </a>
          </Button>
          <div className="hero-note">
            <span className="hero-note-mark" aria-hidden="true">✳</span>
            <p>Thoughtful care for<br />skin, body &amp; spirit</p>
          </div>
        </div>
        <div className="hero-art" role="img" aria-label="Sunlit green leaves and natural textures">
          <div className="hero-art-overlay" />
          <div className="hero-stamp" aria-label="Grounded in nature">
            <span className="stamp-top">GROUNDED IN</span>
            <span className="stamp-leaf" aria-hidden="true">✳</span>
            <span className="stamp-bottom">NATURE</span>
          </div>
          <span className="hero-caption">A softer start to every day.</span>
        </div>
        <a className="scroll-cue" href="#collections" aria-label="Scroll to explore">
          <span aria-hidden="true">↓</span>
        </a>
      </section>

      <section className="intro section-wrap" id="story">
        <p className="eyebrow">The soul in the everyday</p>
        <h2>Care that feels like<br /><span>coming home.</span></h2>
        <p className="intro-copy">
          Soul of Nature is a Black-owned wellness and men&apos;s grooming brand
          grounded in the belief that caring for yourself can bring you closer
          to the natural world—and to who you are.
        </p>
      </section>

      <section className="collections section-wrap" id="collections">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Made for your moments</p>
            <h2>Find your <span>own rhythm.</span></h2>
          </div>
          <p>Small rituals. A little more room to breathe.</p>
        </div>
        <div className="collection-grid">
          {collections.map((collection) => (
            <a key={collection.title} className={`collection-card ${collection.className}`} href={`/shop?category=${collection.category}`}>
              <img src={collection.image} alt={collection.alt} loading="lazy" />
              <span className="collection-shade" />
              <span className="collection-content">
                <span className="collection-number">{collection.number}</span>
                <span className="collection-title">{collection.title}</span>
                <span className="collection-link">Explore the ritual <span aria-hidden="true">↗</span></span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="promise" id="promise">
        <div className="promise-image" role="img" aria-label="A quiet, sunlit moment in nature" />
        <div className="promise-copy">
          <p className="eyebrow">A note on how we care</p>
          <h2>Feel good<br />about <span>what feels good.</span></h2>
          <p>
            We&apos;re building a more thoughtful approach to the things you reach
            for every day—rooted in care for yourself, your community, and the
            world around you.
          </p>
          <a className="text-link" href="/about">Get to know us <span aria-hidden="true">↗</span></a>
        </div>
      </section>

      <section className="closing section-wrap">
        <span className="closing-mark" aria-hidden="true">✳</span>
        <p className="eyebrow">A moment, just for you</p>
        <h2>Make room<br />for <span>yourself.</span></h2>
        <a className="button button-light" href="/shop">
          Explore the collections <span aria-hidden="true">↗</span>
        </a>
      </section>
    </main>
  );
}
