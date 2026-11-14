import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice, getCategories, getProducts } from "@/lib/catalog";

const pageSize = 20;

export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[]; page?: string | string[] }>;
}) {
  const params = await searchParams;
  if (Array.isArray(params.category) || Array.isArray(params.page)) notFound();
  const category = params.category;
  const page = params.page === undefined ? 1 : Number(params.page);
  if (!Number.isSafeInteger(page) || page < 1 || (page - 1) * pageSize > 2147483647) {
    notFound();
  }

  const categories = await getCategories();
  const selected = category ? categories.find((item) => item.slug === category) : undefined;
  if (category && !selected) notFound();
  const products = await getProducts(category, (page - 1) * pageSize);
  const pageLink = (nextPage: number) => {
    const query = new URLSearchParams();
    if (category) query.set("category", category);
    if (nextPage > 1) query.set("page", String(nextPage));
    const suffix = query.toString();
    return suffix ? `/shop?${suffix}` : "/shop";
  };

  return (
    <main className="shop section-wrap">
      <p className="eyebrow">Made for your moments</p>
      <h1>{selected ? selected.name : "Shop all"}</h1>
      <p className="shop-intro">
        {selected?.description || "Thoughtful essentials for your everyday rituals."}
      </p>
      <nav className="shop-filters" aria-label="Product categories">
        <Link href="/shop" aria-current={!category ? "page" : undefined}>All</Link>
        {categories.map((item) => (
          <Link
            href={`/shop?category=${encodeURIComponent(item.slug)}`}
            aria-current={category === item.slug ? "page" : undefined}
            key={item.id}
          >
            {item.name}
          </Link>
        ))}
      </nav>
      {products.length === 0 ? (
        <p className="shop-empty">No products found on this page. <Link href={pageLink(1)}>Browse products</Link></p>
      ) : (
        <div className="product-grid">
          {products.slice(0, pageSize).map((product) => (
            <Link href={`/shop/products/${product.id}`} className="product-card" key={product.id}>
              <div className="product-image">
                {product.image_url ? <img src={product.image_url} alt="" loading="lazy" /> : <span>SOUL OF NATURE</span>}
              </div>
              <p className="eyebrow">{product.category.name}</p>
              <h2>{product.name}</h2>
              <p>{formatPrice(product.price_cents)}</p>
              {product.stock_quantity === 0 && <p className="stock-status">Out of stock</p>}
            </Link>
          ))}
        </div>
      )}
      <nav className="shop-pagination" aria-label="Catalog pages">
        {page > 1 && <Link href={pageLink(page - 1)}>Previous</Link>}
        {products.length > pageSize && <Link href={pageLink(page + 1)}>Next</Link>}
      </nav>
    </main>
  );
}
