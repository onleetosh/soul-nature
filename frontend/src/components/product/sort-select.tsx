"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const options = [
  { value: "name", label: "Name (A–Z)" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
];

export function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get("sort") ?? "name";

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "name") params.delete("sort");
    else params.set("sort", next);
    const qs = params.toString();
    router.push(`/products${qs ? `?${qs}` : ""}`);
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48" aria-label="Sort products">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
