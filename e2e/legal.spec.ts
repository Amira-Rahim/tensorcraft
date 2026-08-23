import { test, expect } from "@playwright/test";

test.describe("Legal Pages", () => {
  test("terms page renders all sections", async ({ page }) => {
    await page.goto("/terms");
    await expect(
      page.getByRole("heading", { name: /terms of service/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /1\. acceptance of terms/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /10\. contact/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /legal@tensorcraft\.app/i }),
    ).toBeVisible();
    // Choice of law was missing entirely until 2026-08-23 (Tier 1-LEGAL).
    await expect(
      page.getByRole("heading", { name: /11\. governing law/i }),
    ).toBeVisible();
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
    await expect(
      page.getByRole("heading", { name: /privacy policy/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /information we collect/i }),
    ).toBeVisible();
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
