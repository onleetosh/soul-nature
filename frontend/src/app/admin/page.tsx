"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { formatPrice } from "@/lib/catalog";
import type { Category, Product } from "@/lib/catalog";
import type { Order } from "@/lib/orders";

type AdminProduct = Product & { sku: string; slug: string; is_active: boolean };
type ProductForm = {
  sku: string; name: string; slug: string; description: string; price: string;
  image_url: string; stock_quantity: string; category_id: string; is_active: boolean;
};
const emptyForm: ProductForm = { sku: "", name: "", slug: "", description: "", price: "", image_url: "", stock_quantity: "0", category_id: "", is_active: true };

async function request<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method, cache: "no-store",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const data: unknown = await response.json();
    const detail = typeof data === "object" && data !== null && "detail" in data && typeof data.detail === "string" ? data.detail : "Please check your input and try again.";
    throw new Error(detail);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export default function AdminPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productOffset, setProductOffset] = useState(0);
  const [orderOffset, setOrderOffset] = useState(0);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [productData, orderData, categoryResponse] = await Promise.all([
        request<AdminProduct[]>(`/api/admin/products?limit=21&offset=${productOffset}`),
        request<Order[]>(`/api/admin/orders?limit=21&offset=${orderOffset}`),
        fetch("/api/admin/categories", { cache: "no-store" }),
      ]);
      if (!categoryResponse.ok) throw new Error("Could not load categories.");
      const categoryData = await categoryResponse.json() as Category[];
      setProducts(productData); setOrders(orderData); setCategories(categoryData);
      setError(null);
    } catch (cause) {
      console.error("Could not load admin data:", cause);
      setError(cause instanceof Error ? cause.message : "Could not load admin data.");
    }
  }, [productOffset, orderOffset]);

  useEffect(() => {
    request<{ authenticated: boolean }>("/api/admin/session").then((result) => setSignedIn(result.authenticated)).catch((cause: unknown) => {
      console.error("Could not check admin session:", cause);
      setError(cause instanceof Error ? cause.message : "Could not check admin session.");
    }).finally(() => setInitializing(false));
  }, []);

  useEffect(() => { if (signedIn) void load(); }, [signedIn, load]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      await request("/api/admin/session", "POST", { token });
      setToken(""); setSignedIn(true);
    } catch (cause) {
      console.error("Admin sign-in failed:", cause);
      setError(cause instanceof Error ? cause.message : "Sign-in failed.");
    } finally { setBusy(false); }
  }

  async function signOut() {
    setBusy(true);
    try {
      await request("/api/admin/session", "DELETE");
      setSignedIn(false); setProducts([]); setOrders([]); setForm(emptyForm); setEditing(null); setError(null);
    } catch (cause) {
      console.error("Admin sign-out failed:", cause);
      setError(cause instanceof Error ? cause.message : "Sign-out failed.");
    } finally { setBusy(false); }
  }

  function edit(product: AdminProduct) {
    setEditing(product.id);
    setForm({ sku: product.sku, name: product.name, slug: product.slug, description: product.description,
      price: (product.price_cents / 100).toFixed(2), image_url: product.image_url ?? "",
      stock_quantity: String(product.stock_quantity), category_id: String(product.category.id), is_active: product.is_active });
    setNotice(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d+(\.\d{1,2})?$/.test(form.price)) { setError("Enter a valid price with at most two decimal places."); return; }
    const price = Math.round(Number(form.price) * 100);
    const stock = Number(form.stock_quantity);
    if (!Number.isSafeInteger(price) || price > 2147483647 || !Number.isInteger(stock) || stock < 0 || stock > 2147483647) {
      setError("Price or stock is out of range."); return;
    }
    setBusy(true); setError(null); setNotice(null);
    try {
      await request(editing ? `/api/admin/products/${editing}` : "/api/admin/products", editing ? "PUT" : "POST", {
        sku: form.sku, name: form.name, slug: form.slug, description: form.description, price_cents: price,
        image_url: form.image_url.trim() || null, stock_quantity: stock, category_id: Number(form.category_id), is_active: form.is_active,
      });
      setForm(emptyForm); setEditing(null); setNotice("Product saved."); await load();
    } catch (cause) {
      console.error("Could not save product:", cause);
      setError(cause instanceof Error ? cause.message : "Could not save product.");
    } finally { setBusy(false); }
  }

  async function deactivate(product: AdminProduct) {
    if (!window.confirm(`Deactivate ${product.name}? It will no longer appear in the shop.`)) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      await request(`/api/admin/products/${product.id}`, "DELETE");
      if (editing === product.id) { setEditing(null); setForm(emptyForm); }
      setNotice("Product deactivated."); await load();
    } catch (cause) {
      console.error("Could not deactivate product:", cause);
      setError(cause instanceof Error ? cause.message : "Could not deactivate product.");
    } finally { setBusy(false); }
  }

  return (
    <main className="shop section-wrap admin-page">
      <p className="eyebrow">Local administration</p>
      <h1>Admin</h1>
      <p className="shop-intro">For local development only. This shared-token interface is not production authentication.</p>
      {error && <p className="cart-error" role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {initializing ? <p role="status">Loading...</p> : !signedIn ? (
        <form className="order-form" onSubmit={signIn}>
          <label htmlFor="admin-token">Admin token</label>
          <input id="admin-token" type="password" autoComplete="off" required value={token} onChange={(event) => setToken(event.target.value)} />
          <button className="button button-dark" disabled={busy}>Sign in</button>
        </form>
      ) : (
        <>
          <button type="button" className="text-link" disabled={busy} onClick={signOut}>Sign out</button>
          <section>
            <h2>{editing ? "Edit product" : "Add product"}</h2>
            <form className="order-form" onSubmit={save}>
              <label htmlFor="product-name">Name</label><input id="product-name" required maxLength={160} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <label htmlFor="product-sku">SKU</label><input id="product-sku" required maxLength={50} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              <label htmlFor="product-slug">Slug</label><input id="product-slug" required maxLength={180} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              <label htmlFor="product-description">Description</label><textarea id="product-description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <label htmlFor="product-price">Price (USD)</label><input id="product-price" type="number" min="0" max="21474836.47" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <label htmlFor="product-stock">Stock quantity</label><input id="product-stock" type="number" min="0" max="2147483647" step="1" required value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
              <label htmlFor="product-image">Image URL (optional)</label><input id="product-image" maxLength={2048} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              <label htmlFor="product-category">Category</label><select id="product-category" required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}><option value="">Select category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <label><input className="order-checkbox" type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
              <button className="button button-dark" disabled={busy}>{editing ? "Save changes" : "Create product"}</button>
              {editing && <button type="button" className="text-link" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel editing</button>}
            </form>
          </section>
          <section>
            <h2>Products</h2>
            {products.length === 0 && <p>No products on this page.</p>}
            {products.slice(0, 20).map((product) => <div className="admin-row" key={product.id}>
              <div><strong>{product.name}</strong> · {product.sku} · {formatPrice(product.price_cents)} · {product.stock_quantity} in stock · {product.is_active ? "Active" : "Inactive"}</div>
              <div><button type="button" className="text-link" onClick={() => edit(product)}>Edit</button>{product.is_active && <button type="button" className="text-link" disabled={busy} onClick={() => deactivate(product)}>Deactivate</button>}</div>
            </div>)}
            <nav className="shop-pagination" aria-label="Admin product pages">
              {productOffset > 0 && <button type="button" onClick={() => setProductOffset(productOffset - 20)}>Previous</button>}
              {products.length > 20 && <button type="button" onClick={() => setProductOffset(productOffset + 20)}>Next</button>}
            </nav>
          </section>
          <section>
            <h2>Orders</h2>
            {orders.length === 0 && <p>No orders on this page.</p>}
            {orders.slice(0, 20).map((order) => <div className="admin-row" key={order.order_number}>
              <div><strong>{order.order_number}</strong> · {order.customer_email} · {order.status} · {formatPrice(order.total_cents)}
                <ul>{order.items.map((item) => <li key={item.id}>{item.product_name} × {item.quantity} · {formatPrice(item.unit_price_cents * item.quantity)}</li>)}</ul>
              </div>
            </div>)}
            <nav className="shop-pagination" aria-label="Admin order pages">
              {orderOffset > 0 && <button type="button" onClick={() => setOrderOffset(orderOffset - 20)}>Previous</button>}
              {orders.length > 20 && <button type="button" onClick={() => setOrderOffset(orderOffset + 20)}>Next</button>}
            </nav>
          </section>
        </>
      )}
    </main>
  );
}
