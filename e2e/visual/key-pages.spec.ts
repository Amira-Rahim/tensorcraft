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

const KEY_PAGES = [
  { name: "landing page", path: "/", base: "landing", maskCanvas: true },
  {
    name: "pricing page",
    path: "/pricing",
    base: "pricing",
    maskCanvas: false,
  },
  {
    name: "themes index",
    path: "/themes",
    base: "themes-index",
    maskCanvas: false,
  },
  {
    name: "auth sign-in page",
    path: "/auth/sign-in",
    base: "auth-sign-in",
    maskCanvas: false,
  },
  {
    name: "paywall page",
    path: "/paywall",
    base: "paywall",
    maskCanvas: false,
  },
] as const;

/* Scheme matrix (light-mode rollout, 2026-07-23): dark keeps the original
   baseline names so pre-light-mode baselines stay valid; light snapshots get
   a `-light` suffix and are minted fresh. */
for (const scheme of ["dark", "light"] as const) {
  const suffix = scheme === "light" ? "-light" : "";

  test.describe(`Visual: Key Pages (desktop 1280×800) [${scheme}]`, () => {
    test.skip(!shouldRun, "Set RUN_VISUAL=1 after generating baselines");
    test.use({ colorScheme: scheme });

    test.beforeEach(async ({ page }) => {
      // Desktop viewport matches dev-plan §8k spec.
      await page.setViewportSize({ width: 1280, height: 800 });
      // Disable animations (ParticleField + BridgeTicker honor this).
      await page.emulateMedia({ reducedMotion: "reduce" });
    });

    for (const { name, path, base, maskCanvas } of KEY_PAGES) {
      test(`${name} matches baseline`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await page.waitForFunction(() => document.fonts.ready);
        await expect(page).toHaveScreenshot(`${base}${suffix}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.001,
          // Canvas animations (five-worlds cards) don't all honor
          // reduced-motion; mask them so frame timing can't flake the diff.
          mask: maskCanvas ? [page.locator("canvas")] : undefined,
        });
      });
    }
  });
}
