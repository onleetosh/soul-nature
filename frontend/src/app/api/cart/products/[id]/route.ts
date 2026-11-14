import { getProduct } from "@/lib/catalog";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return Response.json({ error: "Invalid product ID" }, { status: 400 });
  }
  try {
    const product = await getProduct(id);
    if (!product) return Response.json({ error: "Product not found" }, { status: 404 });
    return Response.json(product, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load cart product:", error);
    return Response.json({ error: "Product service unavailable" }, { status: 502 });
  }
}
