import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="bg-primary px-4 py-1.5 text-center text-xs text-primary-foreground">
        Free shipping on orders over $75 &middot; Crafted in small batches
      </div>
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <MobileNav />
        <Logo />
        <nav className="ml-6 hidden items-center gap-6 text-sm font-medium md:flex">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1" />
      </div>
    </header>
  );
}
