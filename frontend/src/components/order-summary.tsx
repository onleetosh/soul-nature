import { formatPrice } from "@/lib/catalog";
import type { Order } from "@/lib/orders";

export function OrderSummary({ order }: { order: Order }) {
  return (
    <section className="order-summary" aria-label="Order details">
      <p><strong>Order number:</strong> {order.order_number}</p>
      <p><strong>Email:</strong> {order.customer_email}</p>
      <p><strong>Status:</strong> {order.status === "paid" ? "Paid" : order.status === "pending" ? "Pending payment" : order.status}</p>
      <ul>
        {order.items.map((item) => (
          <li key={item.id}>{item.product_name} × {item.quantity} <span>{formatPrice(item.unit_price_cents * item.quantity)}</span></li>
        ))}
      </ul>
      <p className="order-total"><strong>Total</strong> <strong>{formatPrice(order.total_cents)}</strong></p>
    </section>
  );
}
