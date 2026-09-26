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
import path from "node:path";
import { test, expect } from "@playwright/test";

// Hides the Next.js dev-overlay badge at capture time; see screenshot.css.
const SCREENSHOT_STYLE = path.join(__dirname, "screenshot.css");

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
    name: "worlds index",
    path: "/worlds",
    base: "worlds-index",
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
  // maskCanvas false on purpose: the hero orbit canvas spans the whole band,
  // so masking would magenta-block the hero (the landing blind spot,
  // post-launch-backlog). Reduced motion gives every SceneCanvas one
  // deterministic static frame, and the tfjs demo stays on its placeholder
  // because fullPage capture never scrolls, so its IO gate never fires.
  {
    name: "learn page",
    path: "/learn",
    base: "learn",
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
      // The consent bar would otherwise sit in every capture and move with
      // the copy; the lesson and review specs already store a choice.
      await page.addInitScript(() => {
        localStorage.setItem("tc-cookie-consent", "declined");
      });
      // Desktop viewport matches dev-plan §8k spec.
      await page.setViewportSize({ width: 1280, height: 800 });
      // Disable animations (ParticleField + BridgeTicker honor this).
      await page.emulateMedia({ reducedMotion: "reduce" });
    });

    for (const { name, path, base, maskCanvas } of KEY_PAGES) {
      test(`${name} matches baseline`, async ({ page }) => {
        await page.goto(path);
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
        // Pricing only: wait for the curriculum scene's client-side mode
        // resolution and one painted frame, or the capture races the orbit
        // backdrop's first draw. Same wait and rationale as
        // responsive.spec.ts (self-fail caught 2026-08-31).
        if (path === "/pricing") {
          const scene = page
            .locator('[data-testid="curriculum-scene"][data-mode="settled"]')
            .first();
          await scene.waitFor();
          // Fire the backdrop canvas's IntersectionObserver BEFORE the
          // capture: a fullPage screenshot expands the viewport inside
          // toHaveScreenshot, racing the first draw. Same recipe and
          // rationale as responsive.spec.ts (pricing@768, 2026-09-01).
          await scene.scrollIntoViewIfNeeded();
          await page.evaluate(
            () =>
              new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
              ),
          );
          await page.evaluate(() => window.scrollTo(0, 0));
        }
        await expect(page).toHaveScreenshot(`${base}${suffix}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.001,
          stylePath: SCREENSHOT_STYLE,
          // Canvas animations (five-worlds cards) don't all honor
          // reduced-motion; mask them so frame timing can't flake the diff.
          mask: maskCanvas ? [page.locator("canvas")] : undefined,
        });
      });
    }
  });
}
