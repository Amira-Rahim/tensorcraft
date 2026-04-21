/**
 * Visual regression tests — theme palette rendering.
 *
 * Per dev-plan §8k. Confirms the CSS-var cascade works for each of the 5
 * theme landing pages. One baseline per theme.
 *
 * Slugs are the single source of truth from `packages/themes`.
 */
import { test, expect } from "@playwright/test";

const shouldRun = process.env.RUN_VISUAL === "1";

// Source of truth: packages/themes/src/index.ts → `themeSlugs`. Kept inline
// here so this spec stays dependency-free at test-discovery time.
const THEME_SLUGS = [
  "deep-orbit",
  "neon-protocol",
  "signal-ward",
  "nova-canvas",
  "terra-grid",
] as const;

test.describe("Visual — Theme Landing Pages", () => {
  test.skip(!shouldRun, "Set RUN_VISUAL=1 after generating baselines");

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  for (const slug of THEME_SLUGS) {
    test(`theme ${slug} renders correct palette`, async ({ page }) => {
      await page.goto(`/themes/${slug}`);
      await page.waitForLoadState("networkidle");
      await page.waitForFunction(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`theme-${slug}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.001,
      });
    });
  }
});
