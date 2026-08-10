/**
 * Visual regression tests, theme palette rendering.
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

/* Scheme matrix (light-mode rollout, 2026-07-23): dark keeps the original
   baseline names so the pre-light-mode baselines stay valid; light snapshots
   get a `-light` suffix and are minted fresh. */
for (const scheme of ["dark", "light"] as const) {
  const suffix = scheme === "light" ? "-light" : "";

  test.describe(`Visual: Theme Landing Pages [${scheme}]`, () => {
    test.skip(!shouldRun, "Set RUN_VISUAL=1 after generating baselines");
    test.use({ colorScheme: scheme });

    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.emulateMedia({ reducedMotion: "reduce" });
    });

    for (const slug of THEME_SLUGS) {
      test(`theme ${slug} renders correct palette`, async ({ page }) => {
        await page.goto(`/themes/${slug}`);
        await page.waitForLoadState("networkidle");
        // Await the fonts promise for real. The old form was
        // `waitForFunction(() => document.fonts.ready)`, and waitForFunction
        // resolves on any truthy return: a Promise object is ALWAYS truthy,
        // so it waited for nothing and screenshots raced font swap. That is
        // why nav and footer text ghosted, and why auth and themes-index
        // behaved as coin flips (2026-08-09: three consecutive runs each
        // passed a different subset with no code change between them).
        await page.evaluate(async () => {
          await document.fonts.ready;
        });
        await expect(page).toHaveScreenshot(`theme-${slug}${suffix}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.001,
        });
      });
    }
  });
}
