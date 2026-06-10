/**
 * Visual regression tests — responsive layout breakpoints.
 *
 * Per dev-plan §8k. 4 breakpoints × 2 high-impact pages (landing + pricing).
 * Widths: 320 (mobile S), 768 (tablet), 1024 (laptop), 1440 (desktop L).
 */
import { test, expect } from "@playwright/test";

const shouldRun = process.env.RUN_VISUAL === "1";

const BREAKPOINTS = [
  { label: "320", width: 320, height: 640 },
  { label: "768", width: 768, height: 1024 },
  { label: "1024", width: 1024, height: 768 },
  { label: "1440", width: 1440, height: 900 },
] as const;

const PAGES = [
  { name: "landing", path: "/" },
  { name: "pricing", path: "/pricing" },
] as const;

test.describe("Visual — Responsive Breakpoints", () => {
  test.skip(!shouldRun, "Set RUN_VISUAL=1 after generating baselines");

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  for (const pageDef of PAGES) {
    for (const bp of BREAKPOINTS) {
      test(`${pageDef.name} @ ${bp.label}px`, async ({ page }) => {
        await page.setViewportSize({ width: bp.width, height: bp.height });
        await page.goto(pageDef.path);
        await page.waitForLoadState("networkidle");
        await page.waitForFunction(() => document.fonts.ready);
        await expect(page).toHaveScreenshot(`${pageDef.name}-${bp.label}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.001,
          // Canvas animations (five-worlds cards) don't all honor
          // reduced-motion; mask them so frame timing can't flake the diff.
          mask: [page.locator("canvas")],
        });
      });
    }
  }
});
