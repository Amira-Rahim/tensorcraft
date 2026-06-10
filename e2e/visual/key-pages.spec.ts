/**
 * Visual regression tests, key unauth-safe pages.
 *
 * Per dev-plan §8k. Desktop viewport (1280×800). Full-page screenshots.
 *
 * Baselines live at `e2e/visual/__screenshots__/` (Playwright default).
 * To (re)generate baselines, run the dev server then:
 *   pnpm --filter @tensorcraft/web dev  # in another terminal
 *   ./node_modules/.bin/playwright test e2e/visual/ --update-snapshots
 * See `docs/visual-regression.md` for details.
 *
 * Tests are gated on `RUN_VISUAL` env var until baselines are committed.
 * First green run commits the baselines; subsequent runs can drop the gate.
 */
import { test, expect } from "@playwright/test";

// Until baselines are generated locally and committed, these tests are
// `fixme`'d so CI stays green. Set `RUN_VISUAL=1` to execute them.
const shouldRun = process.env.RUN_VISUAL === "1";

test.describe("Visual: Key Pages (desktop 1280×800)", () => {
  test.skip(!shouldRun, "Set RUN_VISUAL=1 after generating baselines");

  test.beforeEach(async ({ page }) => {
    // Desktop viewport matches dev-plan §8k spec.
    await page.setViewportSize({ width: 1280, height: 800 });
    // Disable animations (ParticleField + BridgeTicker honor this).
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("landing page matches baseline", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => document.fonts.ready);
    await expect(page).toHaveScreenshot("landing.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.001,
      // Canvas animations (five-worlds cards) don't all honor
      // reduced-motion; mask them so frame timing can't flake the diff.
      mask: [page.locator("canvas")],
    });
  });

  test("pricing page matches baseline", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => document.fonts.ready);
    await expect(page).toHaveScreenshot("pricing.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.001,
    });
  });

  test("themes index matches baseline", async ({ page }) => {
    await page.goto("/themes");
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => document.fonts.ready);
    await expect(page).toHaveScreenshot("themes-index.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.001,
    });
  });

  test("auth sign-in page matches baseline", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => document.fonts.ready);
    await expect(page).toHaveScreenshot("auth-sign-in.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.001,
    });
  });

  test("paywall page matches baseline", async ({ page }) => {
    await page.goto("/paywall");
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => document.fonts.ready);
    await expect(page).toHaveScreenshot("paywall.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.001,
    });
  });
});
