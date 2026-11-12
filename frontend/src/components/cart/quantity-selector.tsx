"use client";

import { MinusIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
  label = "Quantity",
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  label?: string;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border bg-card" role="group" aria-label={label}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Decrease quantity"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
      >
        <MinusIcon />
      </Button>
      <span className="w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}
