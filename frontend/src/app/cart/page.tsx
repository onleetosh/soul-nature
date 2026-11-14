"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/catalog";
import type { Product } from "@/lib/catalog";

type ProductResult = { id: number; product: Product | null };

export default function CartPage() {
  const { items, ready, error, storageBlocked, setQuantity, removeItem, resetCart } = useCart();
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const ids = items.map((item) => item.productId).join(",");

  useEffect(() => {
    if (!ready || !ids) return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);
    Promise.all(ids.split(",").map(async (id): Promise<ProductResult> => {
      const response = await fetch(`/api/cart/products/${id}`, { cache: "no-store", signal: controller.signal });
      if (response.status === 404) return { id: Number(id), product: null };
      if (!response.ok) throw new Error(`Could not load product ${id}: ${response.status}`);
      return { id: Number(id), product: await response.json() as Product };
    })).then(setProducts).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      console.error("Could not load cart products:", cause);
      setLoadError(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [ids, ready, retry]);

  const isLoading = !ready || (items.length > 0 && (loading || products.map((item) => item.id).join(",") !== ids) && !loadError);
  const subtotal = items.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.productId)?.product;
    return total + (product ? product.price_cents * item.quantity : 0);
  }, 0);
  const hasUnavailable = items.some((item) => {
    const product = products.find((entry) => entry.id === item.productId)?.product;
    return !product || item.quantity > product.stock_quantity;
  });

  return (
    <main className="shop section-wrap">
      <p className="eyebrow">Your everyday ritual</p>
      <h1>Your cart</h1>
      {error && (
        <div className="cart-error" role="alert">
          <p>{error}</p>
          {storageBlocked && <button type="button" className="text-link" onClick={resetCart}>Reset cart</button>}
        </div>
      )}
      {!storageBlocked && isLoading && <p role="status">Loading your cart...</p>}
      {!storageBlocked && !isLoading && items.length === 0 && (
        <p className="shop-intro">Your cart is empty. <Link className="text-link" href="/shop">Explore the shop</Link></p>
      )}
      {!storageBlocked && !isLoading && items.length > 0 && loadError && (
        <div role="alert">
          <p>We couldn&apos;t load your cart products. Please check that the API is running.</p>
          <button type="button" className="button button-dark" onClick={() => setRetry((value) => value + 1)}>Try again</button>
        </div>
      )}
      {!storageBlocked && !isLoading && items.length > 0 && !loadError && (
        <>
          <div className="cart-list">
            {items.map((item) => {
              const product = products.find((entry) => entry.id === item.productId)?.product;
              return (
                <article className="cart-item" key={item.productId}>
                  <div className="product-image">
                    {product?.image_url ? <img src={product.image_url} alt="" /> : <span>SOUL OF NATURE</span>}
                  </div>
                  <div>
                    {product ? (
                      <>
                        <Link className="cart-item-name" href={`/shop/products/${product.id}`}>{product.name}</Link>
                        <p>{formatPrice(product.price_cents)} each</p>
                        {item.quantity > product.stock_quantity && (
                          <p className="cart-error">{product.stock_quantity === 0 ? "Out of stock" : `Only ${product.stock_quantity} available`}</p>
                        )}
                      </>
                    ) : <p className="cart-error">This product is no longer available.</p>}
                    <div className="cart-controls">
                      <button type="button" aria-label={`Decrease quantity of ${product?.name ?? "unavailable product"}`} disabled={item.quantity <= 1} onClick={() => setQuantity(item.productId, item.quantity - 1)}>−</button>
                      <span aria-label="Quantity">{item.quantity}</span>
                      <button type="button" aria-label={`Increase quantity of ${product?.name ?? "unavailable product"}`} disabled={!product || item.quantity >= Math.min(product.stock_quantity, 99)} onClick={() => setQuantity(item.productId, item.quantity + 1)}>+</button>
                      <button type="button" className="cart-remove" onClick={() => removeItem(item.productId)}>Remove</button>
                    </div>
                  </div>
                  {product && <p className="cart-line-price">{formatPrice(product.price_cents * item.quantity)}</p>}
                </article>
              );
            })}
          </div>
          {hasUnavailable ? (
            <p className="cart-error">Update or remove unavailable items to see your subtotal.</p>
          ) : (
            <p className="cart-subtotal">Subtotal <strong>{formatPrice(subtotal)}</strong></p>
          )}
          <p className="shop-intro">Prices and availability can change. Items are not reserved.</p>
          {!hasUnavailable && <p><Link className="button button-dark" href="/checkout">Proceed to checkout</Link></p>}
          <Link className="text-link" href="/shop">Continue shopping</Link>
        </>
      )}
    </main>
  );
}
