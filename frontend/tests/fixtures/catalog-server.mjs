import { createServer } from "node:http";

const port = Number(process.env.TEST_API_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("TEST_API_PORT must be a valid port");
}

const categories = [
  { id: 1, name: "Grooming", slug: "grooming", description: "Grooming essentials" },
  { id: 2, name: "Fragrance", slug: "fragrance", description: "Fragrance essentials" },
  { id: 3, name: "Wellness", slug: "wellness", description: "Wellness essentials" },
];
const products = [
  { id: 1, name: "Nourishing Beard Oil", description: "Botanical oil", price_cents: 2400, image_url: null, stock_quantity: 2, category: categories[0] },
  { id: 2, name: "Stillwood Eau de Parfum", description: "A grounding fragrance", price_cents: 6800, image_url: null, stock_quantity: 4, category: categories[1] },
  { id: 3, name: "Restore Bath Soak", description: "A mineral soak", price_cents: 2600, image_url: null, stock_quantity: 0, category: categories[2] },
];
const orders = new Map();
let sequence = 0;

function respond(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let data = "";
  for await (const chunk of request) data += chunk;
  return JSON.parse(data);
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    if (request.method === "GET" && url.pathname === "/health") {
      return respond(response, 200, { status: "ok" });
    }
    if (request.method === "GET" && url.pathname === "/api/v1/categories") {
      return respond(response, 200, categories);
    }
    if (request.method === "GET" && url.pathname === "/api/v1/products") {
      const selected = products.filter((p) => !url.searchParams.has("category") || p.category.slug === url.searchParams.get("category"));
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const limit = Number(url.searchParams.get("limit") ?? 20);
      return respond(response, 200, selected.slice(offset, offset + limit));
    }
    const match = url.pathname.match(/^\/api\/v1\/products\/(\d+)$/);
    if (request.method === "GET" && match) {
      const product = products.find((p) => p.id === Number(match[1]));
      return respond(response, product ? 200 : 404, product ?? { detail: "Product not found" });
    }
    if (request.method === "POST" && url.pathname === "/api/v1/orders") {
      const payload = await readJson(request);
      const items = payload.items.map((item, index) => {
        const product = products.find((p) => p.id === item.product_id);
        if (!product || item.quantity > product.stock_quantity) throw new Error("Invalid order item");
        return { id: index + 1, product_name: product.name, unit_price_cents: product.price_cents, quantity: item.quantity };
      });
      const number = `SON-${(++sequence).toString(16).toUpperCase().padStart(24, "0")}`;
      const order = {
        order_number: number, customer_email: payload.customer_email.toLowerCase(), status: "pending", items,
        total_cents: items.reduce((sum, item) => sum + item.unit_price_cents * item.quantity, 0),
      };
      orders.set(number, order);
      return respond(response, 201, order);
    }
    if (request.method === "GET" && url.pathname === "/api/v1/orders/lookup") {
      const order = orders.get(url.searchParams.get("order_number"));
      if (!order || order.customer_email !== url.searchParams.get("email")?.toLowerCase()) {
        return respond(response, 404, { detail: "Order not found" });
      }
      return respond(response, 200, order);
    }
    if (request.method === "POST" && url.pathname === "/api/v1/checkout/sessions") {
      return respond(response, 503, { detail: "Stripe test checkout is not configured" });
    }
    if (request.method === "POST" && url.pathname === "/__test/mark-paid") {
      const { order_number: number } = await readJson(request);
      const order = orders.get(number);
      if (!order) return respond(response, 404, { detail: "Order not found" });
      order.status = "paid";
      return respond(response, 200, { status: "paid" });
    }
    return respond(response, 404, { detail: "Not found" });
  } catch (error) {
    console.error("Fixture request failed:", error);
    return respond(response, 500, { detail: "Fixture request failed" });
  }
}).listen(port, "127.0.0.1", () => console.log(`Fixture API listening on ${port}`));
