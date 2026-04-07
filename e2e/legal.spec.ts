import { test, expect } from "@playwright/test";

test.describe("Legal Pages", () => {
  test("terms page renders all sections", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByText("Terms of Service")).toBeVisible();
    await expect(page.getByText("1. Acceptance of Terms")).toBeVisible();
    await expect(page.getByText("9. Contact")).toBeVisible();
    await expect(page.getByText("legal@tensorcraft.app")).toBeVisible();
  });

  test("terms page has back link to home", async ({ page }) => {
    await page.goto("/terms");
    const backLink = page.getByRole("link", { name: /back to home/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL("/");
  });

  test("privacy page renders all sections", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByText("Privacy Policy")).toBeVisible();
    await expect(page.getByText(/information we collect/i)).toBeVisible();
  });

  test("privacy page has back link to home", async ({ page }) => {
    await page.goto("/privacy");
    const backLink = page.getByRole("link", { name: /back to home/i });
    await expect(backLink).toBeVisible();
  });

  test("cookie consent banner appears on first visit", async ({ page }) => {
    // Clear storage to simulate first visit
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByText(/accept all/i)).toBeVisible();
  });

  test("cookie consent banner hides after accepting", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByText(/accept all/i).click();
    await expect(page.getByText(/accept all/i)).not.toBeVisible();
  });
});
