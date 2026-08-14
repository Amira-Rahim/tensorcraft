import { test, expect } from "@playwright/test";

/**
 * Pricing assertions pin to data-testids rather than marketing copy, the
 * copy iterates frequently; the structure (buyable tiers, curriculum
 * preview, refund badge) is the contract.
 */
test.describe("Pricing Page", () => {
  test("renders the pricing heading", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByTestId("pricing-heading")).toBeVisible();
  });

  test("shows only the tier cards a buyer can purchase", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByTestId("pricing-tiers")).toBeVisible();
    await expect(page.getByTestId("tier-card-free")).toBeVisible();
    await expect(page.getByTestId("tier-card-single")).toBeVisible();
    // The bundle cards were removed on 2026-08-09: with one world launched
    // they were three dead CTAs, and a five-card grid whose only live paid
    // card is the second cheapest makes $59 read as an entry tier when it is
    // the entire product.
    await expect(page.getByTestId("tier-card-two")).toHaveCount(0);
    await expect(page.getByTestId("tier-card-three")).toHaveCount(0);
    await expect(page.getByTestId("tier-card-all-five")).toHaveCount(0);
  });

  test("shows no future bundle pricing anywhere", async ({ page }) => {
    // 2026-08-14 owner directive: future product plans are not shown to
    // users. The "listed, not sold" roadmap strip is gone along with the
    // bundle cards it replaced.
    await page.goto("/pricing");
    await expect(page.getByTestId("bundle-roadmap")).toHaveCount(0);
    await expect(page.getByText(/not for sale/i)).toHaveCount(0);
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
