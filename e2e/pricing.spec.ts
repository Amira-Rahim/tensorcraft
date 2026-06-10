import { test, expect } from "@playwright/test";

/**
 * Pricing assertions pin to data-testids rather than marketing copy — the
 * copy iterates frequently; the structure (5 tiers, comparison table,
 * curriculum preview, refund badge) is the contract.
 */
test.describe("Pricing Page", () => {
  test("renders the pricing heading", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByTestId("pricing-heading")).toBeVisible();
  });

  test("shows all 5 tier cards", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByTestId("pricing-tiers")).toBeVisible();
    await expect(page.getByTestId("tier-card-free")).toBeVisible();
    await expect(page.getByTestId("tier-card-all-five")).toBeVisible();
  });

  test("shows feature comparison table with tier columns", async ({ page }) => {
    await page.goto("/pricing");
    const table = page.getByTestId("comparison-table");
    await expect(table).toBeVisible();
    for (const key of ["free", "single", "twoBundle", "threeBundle"]) {
      await expect(page.getByTestId(`comparison-col-${key}`)).toBeVisible();
    }
  });

  test("shows the curriculum preview with Module 1 marked free", async ({
    page,
  }) => {
    await page.goto("/pricing");
    const preview = page.getByTestId("curriculum-preview");
    await expect(preview).toBeVisible();
    await expect(preview.getByText(/free/i).first()).toBeVisible();
  });

  test("shows the refund guarantee badge", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByTestId("refund-guarantee-badge")).toBeVisible();
  });

  test("links to the /compare page", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator('a[href="/compare"]').first()).toBeAttached();
  });

  test("paywall redirect context renders a notice banner", async ({ page }) => {
    await page.goto("/pricing?locked=deep-orbit");
    await expect(page.getByRole("status")).toContainText(/deep orbit/i);
  });
});
