import Link from "next/link";
import { LeafIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
      <LeafIcon className="size-12 text-primary" />
      <h1 className="text-4xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">
        The page you&apos;re looking for has wandered off. Let&apos;s get you back to something good.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/products">Shop products</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
