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
  // /learn shipped 2026-07-24 with zero axe coverage (R3-6) - the exact
  // "gate does not look there" failure mode this suite exists to prevent.
  // Anonymous view: learn is static. /journey was audited here too until
  // its consolidation into /worlds (2026-08-15); restore the entry with
  // the route at world-2 launch (see docs/post-launch-backlog.md).
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
 * out one at a time, in source, next to a comment saying why (the remaining
 * ones sit on the landing page, the module map, and the talking indicator in
 * packages/ui/src/animated-avatar.tsx, which ships wherever AnimatedAvatar
 * renders: the lesson Briefing, Dialogue avatars on the Concept step and the
 * Epilogue, the /learn crew strip and the world page cast).
 * Muting `color-contrast` globally would have hidden the 3.96:1 comment token
 * this suite was written to catch.
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
  // 800ms was too short: the landing hero's demo panel runs 0.9s AFTER a
  // 0.25s delay, so axe sampled it at ~70% opacity and reported the
  // blended foreground as a contrast failure (light mode only, where
  // primary-on-surface has the least headroom). Keep this above the
  // longest entrance animation on any audited page.
  await page.waitForTimeout(1600);

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
 * The step index is seeded through localStorage under the five-step keys
 * that lessonStepKeys builds (apps/web/lib/lesson-phases.ts). exercise-run.spec
 * and end-of-lesson.spec seed the older six-step keys, which
 * restoreLessonSteps migrates. The max key must be seeded too or the step
 * bar clamps back to 0.
 */
const LESSON_PATH = "/worlds/deep-orbit/foundations/introduction-to-tensors";
const STEP_KEY = "tc_step_v2_deep-orbit_introduction-to-tensors";
const MAX_KEY = "tc_step_max_v2_deep-orbit_introduction-to-tensors";
const STEP_NAMES = [
  "Briefing",
  "Concept",
  "Challenge",
  "Takeaways",
  "Epilogue",
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
            // The Takeaways audit (step 3) must scan the recap and the
            // terms list too, beside the recall card in its prompt state
            // (Task 5 addendum item 2).
            localStorage.setItem(
              "tc_recall_deep-orbit_introduction-to-tensors",
              "1",
            );
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

/**
 * Wait for a region's reveal to finish before axe samples it.
 *
 * The Briefing root is `visibility: hidden` while its script is idle
 * (lesson-steps.tsx), and the reduced-motion rule in globals.css gives every
 * element a 0.01ms transition. transition-property keeps its initial value,
 * `all`, so `visibility` transitions too: each nesting level turns visible
 * one frame after its parent. The warm-up region passes toBeVisible() while
 * its radio labels, about a dozen levels down, stay hidden for another 120
 * to 440 ms (measured 2026-10-25). axe caches each node's computed style at
 * its first read, so an audit started in that window read an option's text
 * as hidden and its radio as visible, and reported a `label` violation with
 * an empty implicit label (CI 2026-10-17, dark). Once settled, both radios
 * are named. Poll the subtree instead of guessing a delay.
 */
async function settleReveal(region: import("@playwright/test").Locator) {
  await expect
    .poll(() =>
      region.evaluate(
        (root) =>
          root.getAnimations({ subtree: true }).length === 0 &&
          [root, ...root.querySelectorAll("*")].every(
            (el) => getComputedStyle(el).visibility === "visible",
          ),
      ),
    )
    .toBe(true);
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`due review warm-up is accessible in ${colorScheme}`, async ({
    page,
  }) => {
    // Reduced motion resolves the scene at once, so the post-scene card is
    // on screen without a skip. Lesson 2, because the seeded prompt is
    // lesson 1's and a warm-up only recalls earlier lessons (2026-09-22).
    const { seedDueReview, REVIEW_WARMUP_LESSON } =
      await import("./review-fixture");
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await seedDueReview(page);
    await page.goto(REVIEW_WARMUP_LESSON);
    const warmup = page.getByRole("region", { name: /Warm-up/ });
    await expect(warmup).toBeVisible();
    await settleReveal(warmup);
    expect((await audit(page)).violations).toEqual([]);
    // In the Deep Orbit layout the card's way out is "Show an explanation"
    // (clarity fix 14, 2026-10-12). "I couldn't recall it" only renders
    // outside that layout. The revealed answers are audited too.
    await warmup.getByRole("button", { name: "Show an explanation" }).click();
    await expect(warmup.getByRole("status")).toHaveText(
      "Answers revealed. Read each explanation before continuing.",
    );
    await settleReveal(warmup);
    expect((await audit(page)).violations).toEqual([]);
  });
}
