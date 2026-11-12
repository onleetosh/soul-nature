import { CheckIcon } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/types";

const steps = [
  { status: "paid", label: "Confirmed" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
] as const;

function progressIndex(order: Order) {
  return steps.findIndex((step) => step.status === order.status);
}

export function OrderDetails({ order }: { order: Order }) {
  const current = progressIndex(order);
  const address = [
    order.shipping_line1,
    order.shipping_line2,
    [order.shipping_city, order.shipping_state, order.shipping_postal_code].filter(Boolean).join(", "),
    order.shipping_country,
  ].filter(Boolean);

  return (
    <div className="space-y-6 rounded-xl border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Order</p>
          <h2 className="text-2xl font-semibold">{order.order_number}</h2>
          <p className="text-sm text-muted-foreground">Placed {formatDate(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} className="text-sm" />
      </div>

      {order.status !== "cancelled" && order.status !== "pending" && (
        <ol className="grid grid-cols-3 gap-2">
          {steps.map((step, index) => {
            const done = index <= current;
            return (
              <li key={step.status} className="flex flex-col items-center gap-2 text-center text-xs sm:text-sm">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2",
                    done ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
                  )}
                >
                  {done ? <CheckIcon className="size-4" /> : index + 1}
                </span>
                <span className={done ? "font-medium" : "text-muted-foreground"}>{step.label}</span>
              </li>
            );
          })}
        </ol>
      )}

      <Separator />
      <ul className="space-y-2 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4">
            <span>
              {item.product_name} <span className="text-muted-foreground">× {item.quantity}</span>
            </span>
            <span>{formatPrice(item.unit_price_cents * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <Separator />
      <div className="grid gap-6 sm:grid-cols-2">
        {address.length > 0 && (
          <div className="text-sm">
            <p className="mb-1 font-medium">Shipping to</p>
            {order.customer_name && <p>{order.customer_name}</p>}
            {address.map((line) => (
              <p key={line} className="text-muted-foreground">
                {line}
              </p>
            ))}
          </div>
        )}
        <dl className="space-y-1 text-sm sm:ml-auto sm:w-56">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatPrice(order.subtotal_cents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd>{order.shipping_cents === 0 ? "Free" : formatPrice(order.shipping_cents)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(order.total_cents)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
