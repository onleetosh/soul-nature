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
