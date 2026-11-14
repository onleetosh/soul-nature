import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice, getProduct } from "@/lib/catalog";
import { AddToCart } from "@/components/add-to-cart";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <main className="shop section-wrap">
      <Link className="text-link" href={`/shop?category=${encodeURIComponent(product.category.slug)}`}>
        Back to {product.category.name}
      </Link>
      <div className="product-detail">
        <div className="product-image">
          {product.image_url ? <img src={product.image_url} alt={product.name} /> : <span>SOUL OF NATURE</span>}
        </div>
        <div className="product-detail-copy">
          <p className="eyebrow">{product.category.name}</p>
          <h1>{product.name}</h1>
          <p className="product-price">{formatPrice(product.price_cents)}</p>
          <p className="shop-intro">{product.description}</p>
          <p className="stock-status">{product.stock_quantity > 0 ? "In stock" : "Out of stock"}</p>
          <AddToCart productId={product.id} stock={product.stock_quantity} />
        </div>
      </div>
    </main>
  );
}
