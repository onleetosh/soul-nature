"use client";

import { useEffect, useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminContext } from "@/components/admin/admin-shell";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";
import { adminApi, type ProductInput } from "@/lib/admin";
import { getCategories } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

export function ProductManager() {
  const token = useAdminContext();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([adminApi.listProducts(token), getCategories()])
      .then(([productList, categoryList]) => {
        if (cancelled) return;
        setProducts(productList);
        setCategories(categoryList);
        setError(null);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Could not load products."));
    return () => {
      cancelled = true;
    };
  }, [token, version]);

  function openDialog(product: Product | null) {
    setEditing(product);
    setDialogKey((key) => key + 1);
    setDialogOpen(true);
  }

  async function handleSave(input: ProductInput) {
    if (editing) {
      await adminApi.updateProduct(token, editing.id, input);
      toast.success(`Updated ${input.name}`);
    } else {
      await adminApi.createProduct(token, input);
      toast.success(`Created ${input.name}`);
    }
    setVersion((v) => v + 1);
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteProduct(token, product.id);
      toast.success(`Deleted ${product.name}`);
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete product.");
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Products</h1>
          {products && <p className="text-sm text-muted-foreground">{products.length} products</p>}
        </div>
        <Button onClick={() => openDialog(null)} disabled={categories.length === 0}>
          <PlusIcon /> New product
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!products && !error && <div className="h-64 animate-pulse rounded-xl bg-muted" />}
      {products && (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{product.category?.name}</TableCell>
                  <TableCell className="text-right">{formatPrice(product.price_cents)}</TableCell>
                  <TableCell className="text-right">{product.stock}</TableCell>
                  <TableCell className="hidden space-x-1 md:table-cell">
                    <Badge variant={product.is_active ? "secondary" : "outline"}>
                      {product.is_active ? "Active" : "Hidden"}
                    </Badge>
                    {product.is_featured && <Badge>Featured</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" aria-label={`Edit ${product.name}`} onClick={() => openDialog(product)}>
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${product.name}`}
                      onClick={() => handleDelete(product)}
                    >
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <ProductFormDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        categories={categories}
        onSubmit={handleSave}
      />
    </section>
  );
}
