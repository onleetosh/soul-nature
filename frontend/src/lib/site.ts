export const siteConfig = {
  name: "Soul of Nature",
  tagline: "Natural grooming & wellness, rooted in culture.",
  description:
    "Soul of Nature is a Black-owned wellness and men's grooming brand crafting natural grooming, personal-care, fragrance, and wellness essentials.",
  email: "hello@soulofnature.com",
  nav: [
    { href: "/products", label: "Shop" },
    { href: "/products?category=grooming", label: "Grooming" },
    { href: "/products?category=fragrance", label: "Fragrance" },
    { href: "/products?category=wellness", label: "Wellness" },
    { href: "/about", label: "Our Story" },
  ],
  footer: {
    shop: [
      { href: "/products", label: "All products" },
      { href: "/products?category=grooming", label: "Grooming" },
      { href: "/products?category=personal-care", label: "Personal care" },
      { href: "/products?category=fragrance", label: "Fragrance" },
      { href: "/products?category=wellness", label: "Wellness" },
    ],
    help: [
      { href: "/orders", label: "Order status" },
      { href: "/shipping-returns", label: "Shipping & returns" },
      { href: "/contact", label: "Contact us" },
    ],
    company: [{ href: "/about", label: "Our story" }],
  },
} as const;
