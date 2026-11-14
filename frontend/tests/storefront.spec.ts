import { expect, test } from "@playwright/test";

test("catalog filters, product details and out-of-stock products", async ({ page }) => {
  await page.goto("/shop");
  await expect(page.getByRole("link", { name: /Nourishing Beard Oil/ })).toBeVisible();
  await page.getByRole("navigation", { name: "Product categories" }).getByRole("link", { name: "Fragrance" }).click();
  await expect(page.getByRole("link", { name: /Stillwood Eau de Parfum/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Nourishing Beard Oil/ })).toHaveCount(0);
  await page.goto("/shop/products/3");
  await expect(page.getByRole("button", { name: "Out of stock" })).toBeDisabled();
});

test("cart persists and supports quantity changes and removal", async ({ page }) => {
  await page.goto("/shop/products/1");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.getByRole("link", { name: "View cart" }).click();
  await expect(page.getByText("Subtotal")).toBeVisible();
  await expect(page.getByText("$24.00", { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Increase quantity of Nourishing Beard Oil" })).toBeVisible();
  await page.getByRole("button", { name: "Increase quantity of Nourishing Beard Oil" }).click();
  await expect(page.getByText("$48.00", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Increase quantity of Nourishing Beard Oil" })).toBeDisabled();
  await page.getByRole("button", { name: "Decrease quantity of Nourishing Beard Oil" }).click();
  await expect(page.getByText("$24.00", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Your cart is empty.", { exact: false })).toBeVisible();
});

test("guest order review, pending payment, lookup and paid confirmation", async ({ page, request }) => {
  await page.goto("/shop/products/1");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.getByRole("link", { name: "View cart" }).click();
  await page.getByRole("link", { name: "Proceed to checkout" }).click();
  await page.getByLabel("Email address").fill("customer@example.com");
  await page.getByRole("button", { name: "Review order" }).click();
  await expect(page.getByText("Pending payment")).toBeVisible();
  const reference = await page.locator(".order-summary").innerText();
  const orderNumber = reference.match(/SON-[A-F0-9]{24}/)?.[0];
  expect(orderNumber).toBeTruthy();
  await page.getByRole("button", { name: "Continue to Stripe" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Stripe test checkout is not configured" })).toBeVisible();
  await page.reload();
  await expect(page.getByText(orderNumber!)).toBeVisible();
  await page.goto("/success");
  await expect(page.getByText("Your payment is not confirmed yet.", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Payment confirmed" })).toHaveCount(0);
  await page.goto("/orders");
  await page.getByLabel("Email address").fill("wrong@example.com");
  await page.getByLabel("Order number").fill(orderNumber!);
  await page.getByRole("button", { name: "Find order" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Order not found" })).toBeVisible();
  await page.getByLabel("Email address").fill("customer@example.com");
  await page.getByRole("button", { name: "Find order" }).click();
  await expect(page.getByText("Pending payment")).toBeVisible();
  const paid = await request.post("http://127.0.0.1:18791/__test/mark-paid", { data: { order_number: orderNumber } });
  expect(paid.ok()).toBeTruthy();
  await page.goto("/success");
  await expect(page.getByRole("heading", { name: "Payment confirmed" })).toBeVisible();
});

test("cart displays API failures and can retry", async ({ page }) => {
  await page.goto("/shop/products/1");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.route("**/api/cart/products/1", (route) => route.fulfill({ status: 502, json: { detail: "Unavailable" } }));
  await page.getByRole("link", { name: "View cart" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "We couldn't load your cart products" })).toBeVisible();
  await page.unroute("**/api/cart/products/1");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Subtotal")).toBeVisible();
});

test("information pages remain navigable on a small screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  const footer = page.getByRole("navigation", { name: "Footer navigation" });
  await footer.getByRole("link", { name: "Our story" }).click();
  await expect(page.getByRole("heading", { name: "Care that feels like coming home." })).toBeVisible();
  await footer.getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page.getByText("Our contact details are not available yet.", { exact: false })).toBeVisible();
  await footer.getByRole("link", { name: "Shipping & returns" }).click();
  await expect(page.getByRole("heading", { name: "Returns and refunds" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
