"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ProductInput } from "@/lib/admin";
import type { Category, Product } from "@/lib/types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type FormState = Omit<ProductInput, "price_cents" | "stock" | "category_id" | "image_url"> & {
  price: string;
  stock: string;
  category_id: string;
  image_url: string;
};

function toFormState(product: Product | null, categories: Category[]): FormState {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    ingredients: product?.ingredients ?? "",
    size: product?.size ?? "",
    price: product ? (product.price_cents / 100).toFixed(2) : "",
    stock: String(product?.stock ?? 0),
    image_url: product?.image_url ?? "",
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
    category_id: String(product?.category_id ?? categories[0]?.id ?? ""),
  };
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  onSubmit: (input: ProductInput) => Promise<void>;
}) {
  const [form, setForm] = useState(() => toFormState(product, categories));
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const price = Math.round(Number.parseFloat(form.price) * 100);
    const stock = Number.parseInt(form.stock, 10);
    if (!Number.isFinite(price) || price < 0) return setError("Enter a valid price.");
    if (!Number.isFinite(stock) || stock < 0) return setError("Enter a valid stock quantity.");
    if (!form.category_id) return setError("Choose a category.");
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        ingredients: form.ingredients.trim(),
        size: form.size.trim(),
        price_cents: price,
        stock,
        image_url: form.image_url.trim() || null,
        is_active: form.is_active,
        is_featured: form.is_featured,
        category_id: Number(form.category_id),
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>Prices are in USD. Inactive products are hidden from the storefront.</DialogDescription>
        </DialogHeader>
        <form id="product-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="p-name">Name</Label>
            <Input
              id="p-name"
              required
              value={form.name}
              onChange={(e) => {
                update("name", e.target.value);
                if (!slugTouched) update("slug", slugify(e.target.value));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-slug">Slug</Label>
            <Input
              id="p-slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update("slug", e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={form.category_id} onValueChange={(value) => update("category_id", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-size">Size</Label>
            <Input id="p-size" placeholder="e.g. 2 fl oz" value={form.size} onChange={(e) => update("size", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-price">Price (USD)</Label>
            <Input
              id="p-price"
              required
              inputMode="decimal"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-stock">Stock</Label>
            <Input
              id="p-stock"
              required
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(e) => update("stock", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="p-image">Image URL</Label>
            <Input
              id="p-image"
              type="url"
              placeholder="https://…"
              value={form.image_url}
              onChange={(e) => update("image_url", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="p-description">Description</Label>
            <Textarea
              id="p-description"
              rows={3}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="p-ingredients">Ingredients</Label>
            <Textarea
              id="p-ingredients"
              rows={2}
              value={form.ingredients}
              onChange={(e) => update("ingredients", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch id="p-active" checked={form.is_active} onCheckedChange={(v) => update("is_active", v)} />
            <Label htmlFor="p-active">Active</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="p-featured" checked={form.is_featured} onCheckedChange={(v) => update("is_featured", v)} />
            <Label htmlFor="p-featured">Featured on homepage</Label>
          </div>
        </form>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={saving}>
            {saving && <Loader2Icon className="animate-spin" />} {product ? "Save changes" : "Create product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
