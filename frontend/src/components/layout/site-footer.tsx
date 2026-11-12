import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { siteConfig } from "@/lib/site";

function FooterColumn({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="mb-3 font-sans text-sm font-semibold tracking-normal">{title}</h3>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-secondary/60">
      <div className="container mx-auto grid gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">{siteConfig.description}</p>
        </div>
        <FooterColumn title="Shop" links={siteConfig.footer.shop} />
        <FooterColumn title="Help" links={siteConfig.footer.help} />
        <FooterColumn title="Company" links={siteConfig.footer.company} />
      </div>
      <div className="border-t">
        <p className="container mx-auto px-4 py-4 text-xs text-muted-foreground">
          &copy; {siteConfig.name}. Black-owned. Naturally made.
        </p>
      </div>
    </footer>
  );
}
