"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminContext } from "@/components/admin/admin-shell";
import { OrderDetails } from "@/components/orders/order-details";
import { adminApi } from "@/lib/admin";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "delivered", "cancelled"];
const ALL = "all";

export function OrderManager() {
  const token = useAdminContext();
  const [orders, setOrders] = useState<{ items: Order[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const statusParam = statusFilter === ALL ? undefined : (statusFilter as OrderStatus);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .listOrders(token, { status: statusParam, q: submittedQuery || undefined })
      .then((result) => {
        if (cancelled) return;
        setOrders(result);
        setError(null);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Could not load orders."));
    return () => {
      cancelled = true;
    };
  }, [token, statusParam, submittedQuery]);

  async function loadMore() {
    if (!orders) return;
    setLoadingMore(true);
    try {
      const next = await adminApi.listOrders(token, {
        status: statusParam,
        q: submittedQuery || undefined,
        offset: orders.items.length,
      });
      setOrders((prev) => (prev ? { items: [...prev.items, ...next.items], total: next.total } : next));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load more orders.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function changeStatus(order: Order, status: OrderStatus) {
    try {
      const updated = await adminApi.updateOrderStatus(token, order.id, status);
      setOrders((prev) =>
        prev ? { ...prev, items: prev.items.map((o) => (o.id === updated.id ? updated : o)) } : prev,
      );
      toast.success(`${order.order_number} marked ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update order.");
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Orders</h1>
          {orders && <p className="text-sm text-muted-foreground">{orders.total} orders</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmittedQuery(query.trim());
            }}
          >
            <Input
              aria-label="Search orders"
              placeholder="Email or order #"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-48"
            />
            <Button type="submit" variant="outline" size="icon" aria-label="Search">
              <SearchIcon />
            </Button>
          </form>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!orders && !error && <div className="h-64 animate-pulse rounded-xl bg-muted" />}
      {orders && orders.items.length === 0 && (
        <p className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">No orders found.</p>
      )}
      {orders && orders.items.length > 0 && (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Order</TableHead>
                <TableHead className="hidden md:table-cell">Customer</TableHead>
                <TableHead className="hidden sm:table-cell">Placed</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.items.map((order) => (
                <Fragment key={order.id}>
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={expanded === order.id ? "Hide details" : "Show details"}
                        onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                      >
                        <ChevronDownIcon className={cn("transition-transform", expanded === order.id && "rotate-180")} />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>{order.customer_name || "Guest"}</div>
                      <div className="text-xs text-muted-foreground">{order.email}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(order.created_at)}</TableCell>
                    <TableCell className="text-right">{formatPrice(order.total_cents)}</TableCell>
                    <TableCell>
                      <Select value={order.status} onValueChange={(value) => changeStatus(order, value as OrderStatus)}>
                        <SelectTrigger size="sm" className="w-32 capitalize" aria-label={`Status for ${order.order_number}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((status) => (
                            <SelectItem key={status} value={status} className="capitalize">
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                  {expanded === order.id && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="whitespace-normal">
                        <OrderDetails order={order} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {orders && orders.items.length < orders.total && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : `Load more (${orders.total - orders.items.length} remaining)`}
          </Button>
        </div>
      )}
    </section>
  );
}
