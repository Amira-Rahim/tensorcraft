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
    const paid = page.getByTestId("tier-card-single");
    await expect(paid).toContainText("Introductory price");
    await expect(paid).toContainText("$79");
    await expect(paid).toContainText("Regular price $99");
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

  /**
   * The paywall redirect used to render a notice banner here quoting the
   * offer. It was removed 2026-09-15 (owner request) and <PaywallNotice> is
   * now headless, so the redirect lands on an ordinary /pricing page. This
   * pins that: a returning banner is a regression, not a silent revert.
   * The funnel events it still fires are covered by the unit test at
   * apps/web/app/pricing/__tests__/paywall-notice.test.tsx.
   */
  test("paywall redirect context renders no notice banner", async ({
    page,
  }) => {
    await page.goto("/pricing?locked=deep-orbit");
    await expect(page.getByTestId("pricing-heading")).toBeVisible();
    // Scoped to main: the nav's SchemeToggle carries its own (empty)
    // role="status" live region, so a bare getByRole("status") is ambiguous.
    await expect(page.locator("main").getByRole("status")).toHaveCount(0);
  });
});

/**
 * The tier cards must arrive in the server HTML. When PricingTiers read
 * useSearchParams, the static prerender emitted its empty Suspense fallback,
 * the cards appeared only after hydration, and their arrival pushed the
 * curriculum preview down: one layout shift worth CLS 0.359 on mobile, over
 * the 0.35 Lighthouse budget (2026-10-20 to 2026-10-25). This reads the raw
 * server response, so it fails whenever the grid goes client-only again.
 * (A JavaScript-off page check cannot stand in for it: the route streams
 * under pricing/loading.tsx, and an inline script reveals the whole page.)
 */
test.describe("Pricing Page server HTML", () => {
  test("includes every buyable tier card", async ({ request }) => {
    const response = await request.get("/pricing");
    expect(response.ok()).toBe(true);
    const html = await response.text();
    for (const id of [
      "pricing-tiers",
      "tier-card-free",
      "tier-card-single",
      "curriculum-preview",
    ]) {
      expect(html, id).toContain(`data-testid="${id}"`);
    }
  });
});
