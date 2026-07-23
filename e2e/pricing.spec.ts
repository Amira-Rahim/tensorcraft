import { test, expect } from "@playwright/test";

/**
 * Pricing assertions pin to data-testids rather than marketing copy, the
 * copy iterates frequently; the structure (5 tiers, curriculum preview,
 * refund badge) is the contract.
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

  test("paywall redirect context renders a notice banner", async ({ page }) => {
    await page.goto("/pricing?locked=deep-orbit");
    // Scoped to main: the nav's SchemeToggle carries its own (empty)
    // role="status" live region, so a bare getByRole("status") is ambiguous.
    await expect(page.locator("main").getByRole("status")).toContainText(
      /deep orbit/i,
    );
  });
});
