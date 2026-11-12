// Mirrors the backend defaults (SHIPPING_FLAT_CENTS / FREE_SHIPPING_THRESHOLD_CENTS); the API is authoritative.
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500;
export const FLAT_SHIPPING_CENTS = 695;
export const MAX_QUANTITY_PER_ITEM = 20;

export function estimateShipping(subtotalCents: number) {
  if (subtotalCents === 0) return 0;
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
}
