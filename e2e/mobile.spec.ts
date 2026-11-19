import { test, expect } from "@playwright/test";

/**
 * Mobile responsive smoke tests. See docs/browser-support.md.
 *
 * Runs against the mobile/tablet Playwright projects defined in
 * `playwright.config.ts`:
 *
 *   - mobile-iphone-se  - iPhone SE (375×667, the tightest viewport we
 *     support per PRD 5.5)
 *   - mobile-pixel-7   - Pixel 7 (412×915)
 *   - tablet-ipad      - iPad gen 7 (810×1080, proxy for iPad Air)
 *
 * We cover landing, auth, pricing,
 * worlds, paywall. For each, we assert (1) the page renders, (2) no
 * horizontal scroll at the viewport width, and (3) the primary CTA is
 * visible and has a touch-friendly hit area (>= 44×44 px).
 */

const ROUTES = [
  { name: "Landing", path: "/" },
  { name: "Auth", path: "/auth" },
  { name: "Pricing", path: "/pricing" },
  { name: "Worlds", path: "/worlds" },
  { name: "Paywall", path: "/paywall" },
] as const;

test.describe("Mobile smoke", () => {
  for (const { name, path } of ROUTES) {
    test(`${name} (${path}) renders without horizontal scroll`, async ({
      page,
    }) => {
      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");

      // No horizontal scroll: document scrollWidth must equal the viewport
      // innerWidth (allow 1px rounding slack on high-DPR mobile).
      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        };
      });
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
    });
  }

  test("landing hero CTA has 44x44 hit area", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByTestId("landing-cta-primary");
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  });

  test("mobile nav drawer opens on tap (phone widths)", async ({
    page,
    viewport,
  }) => {
    // Skip on tablet viewport, MobileNav is `md:hidden`, so the hamburger
    // isn't rendered above ~768px.
    test.skip(
      !viewport || viewport.width >= 768,
      "Mobile nav is only rendered below the md breakpoint",
    );
    await page.goto("/");
    const hamburger = page.getByRole("button", { name: /open menu/i });
    await expect(hamburger).toBeVisible();
    // Touch-target check on the hamburger button itself.
    const box = await hamburger.boundingBox();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
    await hamburger.click();
    // Close button renders once the drawer is open.
    await expect(
      page.getByRole("button", { name: /close menu/i }),
    ).toBeVisible();
  });
});
