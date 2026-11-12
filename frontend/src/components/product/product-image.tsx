import { DropletsIcon, FlowerIcon, LeafIcon, SparklesIcon, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

const styles: Record<string, { icon: LucideIcon; className: string }> = {
  grooming: { icon: SparklesIcon, className: "from-[oklch(0.42_0.06_155)] to-[oklch(0.3_0.04_155)]" },
  "personal-care": { icon: DropletsIcon, className: "from-[oklch(0.78_0.06_85)] to-[oklch(0.62_0.08_70)]" },
  fragrance: { icon: FlowerIcon, className: "from-[oklch(0.55_0.1_45)] to-[oklch(0.38_0.07_40)]" },
  wellness: { icon: LeafIcon, className: "from-[oklch(0.62_0.08_140)] to-[oklch(0.45_0.07_150)]" },
};

export function ProductImage({ product, className }: { product: Pick<Product, "name" | "image_url" | "category" | "size">; className?: string }) {
  if (product.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- admin-provided URLs may be on any host
      <img src={product.image_url} alt={product.name} className={cn("aspect-square w-full object-cover", className)} />
    );
  }
  const style = styles[product.category?.slug ?? ""] ?? styles.grooming;
  const Icon = style.icon;
  return (
    <div
      role="img"
      aria-label={product.name}
      className={cn(
        "relative flex aspect-square w-full flex-col items-center justify-center gap-3 bg-gradient-to-br text-white",
        style.className,
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
      <Icon className="relative size-14 opacity-90" strokeWidth={1.25} />
      <span className="relative max-w-[80%] text-center font-heading text-lg leading-tight">{product.name}</span>
      {product.size && <span className="relative text-xs uppercase tracking-widest opacity-80">{product.size}</span>}
    </div>
  );
}
