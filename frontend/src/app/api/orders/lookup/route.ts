import { forwardOrderRequest } from "@/lib/order-api";

export function POST(request: Request): Promise<Response> {
  return forwardOrderRequest(request, "/api/v1/orders/lookup", "GET");
}
