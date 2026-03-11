import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders hero section with headline", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText("You Already Think Like an ML Engineer"),
    ).toBeVisible();
  });

  test("displays navigation with brand and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("tensorcraft")).toBeVisible();
    await expect(page.getByRole("link", { name: /start now/i })).toBeVisible();
  });

  test("shows theme section with Deep Orbit", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/deep orbit/i).first()).toBeVisible();
  });

  test("footer renders with legal links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /terms/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /privacy/i })).toBeVisible();
  });

  test("sign-in CTA navigates to auth page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /start now/i }).click();
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test("page title contains Tensorcraft", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Tensorcraft/);
  });
});
