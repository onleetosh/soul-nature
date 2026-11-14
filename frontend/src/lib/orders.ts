export type Order = {
  order_number: string;
  customer_email: string;
  status: string;
  total_cents: number;
  items: {
    id: number;
    product_name: string;
    unit_price_cents: number;
    quantity: number;
  }[];
};

export type OrderReference = { email: string; orderNumber: string };

const referenceKey = "soul-nature-checkout-order";

export function saveOrderReference(reference: OrderReference): void {
  sessionStorage.setItem(referenceKey, JSON.stringify(reference));
}

export function readOrderReference(): OrderReference | null {
  const raw = sessionStorage.getItem(referenceKey);
  if (!raw) return null;
  const value: unknown = JSON.parse(raw);
  if (
    typeof value !== "object" || value === null ||
    !("email" in value) || typeof value.email !== "string" ||
    !("orderNumber" in value) || typeof value.orderNumber !== "string" ||
    !/^SON-[A-F0-9]{24}$/.test(value.orderNumber)
  ) throw new Error("Invalid saved order");
  return { email: value.email, orderNumber: value.orderNumber };
}

export function clearOrderReference(): void {
  sessionStorage.removeItem(referenceKey);
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    const data: unknown = await response.json();
    const detail = typeof data === "object" && data !== null && "detail" in data && typeof data.detail === "string"
      ? data.detail
      : "The request could not be completed. Please check your details and try again.";
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}
