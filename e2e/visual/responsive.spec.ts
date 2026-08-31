/**
 * Visual regression tests, responsive layout breakpoints.
 *
 * Per dev-plan §8k. 4 breakpoints × 2 high-impact pages (landing + pricing).
 * Widths: 320 (mobile S), 768 (tablet), 1024 (laptop), 1440 (desktop L).
 */
import path from "node:path";
import { test, expect } from "@playwright/test";

// Hides the Next.js dev-overlay badge at capture time; see screenshot.css.
const SCREENSHOT_STYLE = path.join(__dirname, "screenshot.css");

const shouldRun = process.env.RUN_VISUAL === "1";

const BREAKPOINTS = [
  { label: "320", width: 320, height: 640 },
  { label: "768", width: 768, height: 1024 },
  { label: "1024", width: 1024, height: 768 },
  { label: "1440", width: 1440, height: 900 },
] as const;

/* maskCanvas mirrors the per-page flag in key-pages.spec.ts.
   Until 2026-08-09 this file masked `canvas` on BOTH pages. On /pricing the
   only canvas is AmbientBackground, which is absolutely positioned at
   inset-0, so the mask covered the entire page: all four pricing baselines
   were a magenta rectangle with a nav and a footer, and no layout regression
   inside the page body could ever fail them. The mask exists for the
   five-worlds cards on the landing page, which do not honour reduced-motion;
   pricing has no such canvas and needs none. */
const PAGES = [
  { name: "landing", path: "/", maskCanvas: true },
  { name: "pricing", path: "/pricing", maskCanvas: false },
] as const;

test.describe("Visual: Responsive Breakpoints", () => {
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
        // Await the fonts promise for real. The old form was
        // `waitForFunction(() => document.fonts.ready)`, and waitForFunction
        // resolves on any truthy return: a Promise object is ALWAYS truthy,
        // so it waited for nothing and screenshots raced font swap. That is
        // why nav and footer text ghosted, and why auth and worlds-index
        // behaved as coin flips (2026-08-09: three consecutive runs each
        // passed a different subset with no code change between them).
        await page.evaluate(async () => {
          await document.fonts.ready;
        });
        // If a captured page ever mounts a component whose HEIGHT depends
        // on load state (the removed hero Deep Scan demo self-failed the
        // 320px baseline this way on 2026-08-31), wait for its terminal
        // state before capture; see "layout race" in docs/visual-regression.md.
        await expect(page).toHaveScreenshot(`${pageDef.name}-${bp.label}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.001,
          stylePath: SCREENSHOT_STYLE,
          // Canvas animations (five-worlds cards) don't all honor
          // reduced-motion; mask them so frame timing can't flake the diff.
          mask: pageDef.maskCanvas ? [page.locator("canvas")] : undefined,
        });
      });
    }
  }
});
