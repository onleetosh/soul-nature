import { adminToken, authenticated, createSession, forwardAdmin, removeSession, sameOrigin } from "@/lib/admin-server";
import { timingSafeEqual } from "node:crypto";

export async function GET() {
  const token = adminToken();
  if (!token) return Response.json({ detail: "Admin authentication is not configured." }, { status: 503 });
  return Response.json({ authenticated: await authenticated(token) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ detail: "Request origin is not allowed." }, { status: 403 });
  const token = adminToken();
  if (!token) return Response.json({ detail: "Admin authentication is not configured." }, { status: 503 });
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ detail: "Invalid request." }, { status: 400 });
  }
  if (typeof payload !== "object" || payload === null || !("token" in payload) || typeof payload.token !== "string") {
    return Response.json({ detail: "Admin token is required." }, { status: 400 });
  }
  const supplied = Buffer.from(payload.token);
  const expected = Buffer.from(token);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return Response.json({ detail: "Invalid admin token." }, { status: 401 });
  }
  const check = await forwardAdmin("/api/v1/admin/products?limit=1", token);
  if (!check.ok) return check;
  await createSession(token);
  return Response.json({ authenticated: true }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return Response.json({ detail: "Request origin is not allowed." }, { status: 403 });
  await removeSession();
  return Response.json({ authenticated: false }, { headers: { "Cache-Control": "no-store" } });
}
