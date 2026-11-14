import { authorizedRequest, forwardAdmin } from "@/lib/admin-server";

async function handle(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const token = await authorizedRequest(request);
  if (token instanceof Response) return token;
  const { path } = await params;
  const [resource, id] = path;
  const isProducts = resource === "products";
  const isOrders = resource === "orders";
  const isCategories = resource === "categories";
  if (path.length > 2 || (!isProducts && !isOrders && !isCategories) || (id && (!isProducts || !/^[1-9]\d*$/.test(id)))) {
    return Response.json({ detail: "Not found." }, { status: 404 });
  }
  if ((request.method === "POST" && (!isProducts || id)) ||
      (["PUT", "DELETE"].includes(request.method) && (!isProducts || !id)) ||
      (request.method === "GET" && id && !isProducts)) {
    return Response.json({ detail: "Method not allowed." }, { status: 405 });
  }
  const query = request.method === "GET" ? new URL(request.url).search : "";
  const target = isCategories ? "/api/v1/categories" : `/api/v1/admin/${resource}${id ? `/${id}` : ""}${query}`;
  const body = ["POST", "PUT"].includes(request.method) ? await request.text() : undefined;
  return forwardAdmin(target, token, request.method, body);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
