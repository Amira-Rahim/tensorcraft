import { test, expect } from "@playwright/test";

test.describe("Pricing Page", () => {
  test("renders pricing page with all tiers", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText(/Simple, Fair Pricing/i)).toBeVisible();
  });

  test("shows free preview tier", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText(/Free Preview/i)).toBeVisible();
    await expect(page.getByText(/\$0/)).toBeVisible();
  });

  test("shows single theme tier at $79", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText(/Single Theme/i)).toBeVisible();
    await expect(page.getByText(/\$79/)).toBeVisible();
  });

  test("shows bundle tiers", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText(/2 Themes/i)).toBeVisible();
    await expect(page.getByText(/3 Themes/i)).toBeVisible();
    await expect(page.getByText(/All 5 Themes/i)).toBeVisible();
  });

  test("shows feature comparison table", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText(/Free vs Paid/i)).toBeVisible();
  });

  test("has CTA footer", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText(/Explore All Themes/i)).toBeVisible();
  });
});
