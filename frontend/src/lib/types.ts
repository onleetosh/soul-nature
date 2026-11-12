export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  ingredients: string;
  size: string;
  price_cents: number;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  category_id: number;
  category: Category | null;
  created_at: string;
  updated_at: string;
};

export type ProductList = {
  items: Product[];
  total: number;
};

export type CheckoutSessionCreated = { id: string; url: string };

export type CheckoutSessionStatus = {
  status: "complete" | "processing";
  order_number: string | null;
  email: string | null;
};

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export type OrderItem = {
  id: number;
  product_id: number | null;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
};

export type Order = {
  id: number;
  order_number: string;
  email: string;
  customer_name: string;
  status: OrderStatus;
  currency: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  shipping_line1: string;
  shipping_line2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  created_at: string;
  items: OrderItem[];
};
