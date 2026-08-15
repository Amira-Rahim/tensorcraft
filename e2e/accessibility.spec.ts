import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  { name: "Landing", path: "/" },
  { name: "Auth", path: "/auth" },
  { name: "Terms", path: "/terms" },
  { name: "Privacy", path: "/privacy" },
  { name: "Worlds", path: "/worlds" },
  { name: "World Detail", path: "/worlds/deep-orbit" },
  // The module route (/worlds/{slug}/{module}) is a redirect shim to the
  // world page, auditing it just re-audits World Detail and races axe
  // against the navigation. Pricing is audited instead.
  { name: "Pricing", path: "/pricing" },
  // /journey and /learn shipped 2026-07-23/24 with zero axe coverage
  // (R3-6) - the exact "gate does not look there" failure mode this suite
  // exists to prevent. Anonymous views: journey renders its signed-out
  // band, learn is static.
  { name: "Journey", path: "/journey" },
  { name: "Learn", path: "/learn" },
  {
    name: "Lesson Viewer",
    path: "/worlds/deep-orbit/foundations/introduction-to-tensors",
  },
];

/**
 * `[data-decorative]` is the ONLY exclusion, and it is deliberately an
 * attribute rather than a rule mute: WCAG 1.4.3 exempts pure decoration from
 * contrast, but nothing exempts a page from the rule itself. An element opts
 * out one at a time, in source, next to a comment saying why (the epilogue's
 * FADE OUT slug is currently the only one). Muting `color-contrast` globally
 * would have hidden the 3.96:1 comment token this suite was written to catch.
 */
async function audit(page: import("@playwright/test").Page) {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .exclude("[data-decorative]")
    .analyze();
}

/** Settle entrance animations before axe samples computed colors. */
async function settle(page: import("@playwright/test").Page, path: string) {
  // Skip entrance animations, axe samples computed colors, and an
  // element mid-fade reports a blended (lower-contrast) foreground.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  // framer-motion entrance animations don't all respect the emulated
  // reduced-motion preference; let them finish before sampling colors.
  await page.waitForTimeout(800);

  // Code steps are highlighted by shiki, which paints token colours onto
  // `.line span`. Sampling before that lands measures UNSTYLED tokens and
  // reports contrast failures that do not exist in the shipped page: the Code
  // step failed exactly once under full-suite load and passed 3/3 in
  // isolation. Wait for the highlighter rather than widening the timeout,
  // which only moves the race.
  const highlighted = page.locator("pre code .line span").first();
  if ((await page.locator("pre code").count()) > 0) {
    await highlighted.waitFor({ state: "attached", timeout: 10_000 });
  }
}

/**
 * Scheme matrix (light-mode rollout, 2026-07-23). Every audit runs once per
 * color scheme. `test.use({ colorScheme })` drives `prefers-color-scheme`,
 * which the FOUC bootstrap in layout.tsx resolves into `data-scheme` - so the
 * light pass exercises the real system-follow path end to end, not a
 * localStorage shortcut. This suite is the contrast gate that certifies the
 * light palette; a light-only violation is a palette bug (darken the token in
 * worlds.css), never a reason to mute the rule. The global `colorScheme:
 * "dark"` pin in playwright.config.ts is overridden per-describe here.
 */
const SCHEMES = ["dark", "light"] as const;

for (const scheme of SCHEMES) {
  test.describe(`Accessibility audits [${scheme}]`, () => {
    test.use({ colorScheme: scheme });
    for (const { name, path } of pages) {
      test(`${name} page (${path}) passes axe audit`, async ({ page }) => {
        await settle(page, path);
        const results = await audit(page);
        expect(results.violations).toEqual([]);
      });
    }
  });
}

/**
 * Per-step lesson audit (audit run #6, 2026-07-15).
 *
 * The "Lesson Viewer" entry above loads a fresh URL with empty localStorage,
 * so it lands on step 0 and ONLY EVER AUDITS STEP 0. Six audit rounds read
 * that suite as "the lesson viewer is AA-clean"; in fact the exercise runner
 * - the editor, the run button, the per-test pass/fail list, the hint panel -
 * had never been scanned once. The design system claims WCAG 2.1 AA, and
 * that claim is only as wide as what the gate actually loads.
 *
 * The step index is seeded through localStorage exactly as exercise-run.spec
 * and end-of-lesson.spec do (see getStorageKey in lesson-steps.tsx); the max
 * key must be seeded too or the step bar clamps back to 0.
 */
const LESSON_PATH = "/worlds/deep-orbit/foundations/introduction-to-tensors";
const STEP_KEY = "tc_step_deep-orbit_introduction-to-tensors";
const MAX_KEY = "tc_step_max_deep-orbit_introduction-to-tensors";
const STEP_NAMES = [
  "Briefing",
  "Concept",
  "Code",
  "Challenge",
  "Takeaways",
  "Complete",
];

for (const scheme of SCHEMES) {
  test.describe(`Accessibility audits - every lesson step [${scheme}]`, () => {
    test.use({ colorScheme: scheme });
    STEP_NAMES.forEach((stepName, index) => {
      test(`Lesson step ${index} (${stepName}) passes axe audit`, async ({
        page,
      }) => {
        await page.addInitScript(
          ({ stepKey, maxKey, step }) => {
            localStorage.setItem(stepKey, String(step));
            localStorage.setItem(maxKey, String(step));
          },
          { stepKey: STEP_KEY, maxKey: MAX_KEY, step: index },
        );
        await settle(page, LESSON_PATH);
        const results = await audit(page);
        expect(
          results.violations,
          `Lesson step ${index} (${stepName}) has axe violations:\n${results.violations
            .map(
              (v) =>
                `  ${v.id} (${v.impact}) x${v.nodes.length}\n` +
                v.nodes
                  .map(
                    (n) =>
                      `    ${n.target.join(" ")}\n      ${n.failureSummary?.replace(/\n/g, "\n      ")}`,
                  )
                  .join("\n"),
            )
            .join("\n")}`,
        ).toEqual([]);
      });
    });
  });
}
