const apiBase = process.env.API_BASE_URL || "http://127.0.0.1:8000";

export async function forwardOrderRequest(request: Request, path: string, method: "POST" | "GET"): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ detail: "Invalid request body." }, { status: 400 });
  }

  let url: URL;
  let body: string | undefined;
  if (method === "GET") {
    if (
      typeof payload !== "object" || payload === null ||
      !("email" in payload) || typeof payload.email !== "string" ||
      !("order_number" in payload) || typeof payload.order_number !== "string"
    ) return Response.json({ detail: "Email and order number are required." }, { status: 400 });
    url = new URL(path, apiBase);
    url.searchParams.set("email", payload.email);
    url.searchParams.set("order_number", payload.order_number);
  } else {
    url = new URL(path, apiBase);
    body = JSON.stringify(payload);
  }

  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const data: unknown = await response.json();
    return Response.json(data, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(`Order API ${path} failed:`, error);
    return Response.json({ detail: "The order service is unavailable. Please try again." }, { status: 502 });
  }
}
