import Link from "next/link";
import { LeafIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 font-heading text-xl font-semibold", className)}>
      <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <LeafIcon className="size-4" />
      </span>
      <span>
        Soul <span className="text-brand-gold">of</span> Nature
      </span>
    </Link>
  );
}
