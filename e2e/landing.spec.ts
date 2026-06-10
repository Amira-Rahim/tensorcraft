import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders hero section with headline", async ({ page }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toContainText(/ml speaks javascript/i);
    await expect(h1).toContainText(/turns out you'?re fluent/i);
  });

  test("displays navigation with brand and CTA", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByTestId("site-nav");
    await expect(nav).toContainText(/tensorcraft/i);
    await expect(nav.getByRole("link", { name: /start now/i })).toBeVisible();
  });

  test("shows theme section with Deep Orbit", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/deep orbit/i).first()).toBeVisible();
  });

  test("footer renders with legal links", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: /terms/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /privacy/i })).toBeVisible();
  });

  test("final CTA navigates to auth page", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("landing-cta-final").click();
    await expect(page).toHaveURL(/\/auth/);
  });

  test("links to the /compare page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/compare"]').first()).toBeAttached();
  });

  test("page title contains Tensorcraft", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Tensorcraft/);
  });
});
