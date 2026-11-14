import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "soul-nature-admin";
const lifetime = 8 * 60 * 60;

export function adminToken(): string | null {
  if (process.env.ADMIN_LOCAL_ENABLED !== "true") return null;
  const token = process.env.ADMIN_API_TOKEN;
  return token && token.length >= 32 && /^[\x20-\x7e]+$/.test(token) ? token : null;
}

function signature(expiry: string, token: string): string {
  return createHmac("sha256", token).update(`admin-session:${expiry}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const first = Buffer.from(a);
  const second = Buffer.from(b);
  return first.length === second.length && timingSafeEqual(first, second);
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
      url.host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function createSession(token: string): Promise<void> {
  const expiry = String(Math.floor(Date.now() / 1000) + lifetime);
  (await cookies()).set(cookieName, `${expiry}.${signature(expiry, token)}`, {
    httpOnly: true, sameSite: "strict", secure: false, path: "/", maxAge: lifetime,
  });
}

export async function removeSession(): Promise<void> {
  (await cookies()).delete(cookieName);
}

export async function authenticated(token: string): Promise<boolean> {
  const value = (await cookies()).get(cookieName)?.value;
  if (!value) return false;
  const [expiry, mac, extra] = value.split(".");
  if (!expiry || !mac || extra !== undefined || !/^\d{1,12}$/.test(expiry)) return false;
  const timestamp = Number(expiry);
  if (!Number.isSafeInteger(timestamp) || timestamp <= Date.now() / 1000 || timestamp > Date.now() / 1000 + lifetime) return false;
  return safeEqual(mac, signature(expiry, token));
}

export async function forwardAdmin(path: string, token: string, method = "GET", body?: string): Promise<Response> {
  try {
    const response = await fetch(new URL(path, process.env.API_BASE_URL || "http://127.0.0.1:8000"), {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 204) return new Response(null, { status: 204 });
    return Response.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin API request failed:", error);
    return Response.json({ detail: "The admin service is unavailable." }, { status: 502 });
  }
}

export async function authorizedRequest(request: Request): Promise<string | Response> {
  if (request.method !== "GET" && !sameOrigin(request)) {
    return Response.json({ detail: "Request origin is not allowed." }, { status: 403 });
  }
  const token = adminToken();
  if (!token) return Response.json({ detail: "Admin authentication is not configured." }, { status: 503 });
  if (!await authenticated(token)) return Response.json({ detail: "Please sign in." }, { status: 401 });
  return token;
}
