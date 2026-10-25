import { test, expect } from "@playwright/test";

test.describe("Worlds Page", () => {
  test("renders world listing with Deep Orbit", async ({ page }) => {
    await page.goto("/worlds");
    await expect(page.getByText(/deep orbit/i).first()).toBeVisible();
  });

  test("Deep Orbit shows Live, the other 4 show Coming soon", async ({
    page,
  }) => {
    await page.goto("/worlds");
    await expect(page.getByTestId("world-status-deep-orbit")).toContainText(
      /live/i,
    );
    for (const slug of [
      "neon-protocol",
      "signal-ward",
      "nova-canvas",
      "terra-grid",
    ]) {
      await expect(page.getByTestId(`world-status-${slug}`)).toContainText(
        /coming soon/i,
      );
    }
  });

  test("coming-soon world route renders waitlist stub, not 404", async ({
    page,
  }) => {
    const response = await page.goto("/worlds/neon-protocol");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByTestId("coming-soon-stub-neon-protocol"),
    ).toBeVisible();
    await expect(
      page.getByTestId("world-waitlist-input-neon-protocol-hero"),
    ).toBeVisible();
    await expect(
      page.getByTestId("world-waitlist-input-neon-protocol-footer"),
    ).toBeVisible();
  });

  test("coming-soon stub shows module roster from preview data", async ({
    page,
  }) => {
    await page.goto("/worlds/signal-ward");
    // The 2026-07-19 stub redesign renders the module code and title as
    // separate spans (no " · " separator string); pre-existing test drift
    // caught during the light-mode close-out battery (2026-07-23).
    const roster = page
      .getByTestId("coming-soon-roster")
      .or(page.locator("main"));
    await expect(roster.getByText("W01", { exact: true })).toBeVisible();
    await expect(roster.getByText("ML Through Text")).toBeVisible();
    await expect(roster.getByText("W11", { exact: true })).toBeVisible();
    await expect(roster.getByText("Capstone: Diagnostic One")).toBeVisible();
  });

  test("coming-soon lesson + capstone routes 404", async ({ page }) => {
    // Two navigations that each cold-compile the heaviest routes ([lesson]
    // and capstone) on the dev webServer. Under full-suite parallel load the
    // second goto alone can exceed the 30s test ceiling (observed 2026-08-12),
    // which times the test out before its assertions run. slow() triples the
    // budget; the 404 assertions are unchanged.
    test.slow();
    const lesson = await page.goto(
      "/worlds/neon-protocol/foundations/introduction-to-tensors",
    );
    expect(lesson?.status()).toBe(404);
    const capstone = await page.goto("/worlds/neon-protocol/capstone");
    expect(capstone?.status()).toBe(404);
  });

  test("Deep Orbit links to its world page", async ({ page }) => {
    // Pre-dismiss the cookie banner, under parallel load it can slide in
    // mid-click and intercept the pointer event.
    await page.addInitScript(() => {
      localStorage.setItem("tc-cookie-consent", "declined");
    });
    await page.goto("/worlds");
    // World cards link to /worlds/{slug}, click on the Deep Orbit card link
    const deepOrbitLink = page
      .getByRole("link", { name: /deep orbit/i })
      .first();
    await deepOrbitLink.click();
    await expect(page).toHaveURL(/\/worlds\/deep-orbit/);
  });
});

test.describe("World Detail Page", () => {
  test("renders Deep Orbit world page with module map and lessons", async ({
    page,
  }) => {
    await page.goto("/worlds/deep-orbit");
    await expect(page.getByTestId("module-map")).toBeVisible();
    await expect(page.getByText(/foundations/i).first()).toBeVisible();
    // Lesson 1 (slug introduction-to-tensors) is titled "From JavaScript
    // Arrays to Tensors" since 2026-10-09.
    await expect(
      page
        .getByTestId("module-map")
        .getByText("From JavaScript Arrays to Tensors", { exact: true }),
    ).toBeVisible();
  });

  test("shows module list with correct order", async ({ page }) => {
    await page.goto("/worlds/deep-orbit");
    await expect(page.getByText(/foundations/i).first()).toBeVisible();
    await expect(page.getByText(/neural networks/i).first()).toBeVisible();
    // Module 3 is titled "Training: Loss, Gradients & Optimization". The old
    // /training loop/i matched nothing on this page: "The Training Loop" is a
    // lesson title inside module 3, which stays collapsed for guests.
    await expect(page.getByText(/training:/i).first()).toBeVisible();
  });

  test("shows lesson estimated time", async ({ page }) => {
    await page.goto("/worlds/deep-orbit");
    await expect(
      page
        .getByTestId("module-map")
        .getByText(/^Lesson \d+ · \d+ min$/)
        .first(),
    ).toBeVisible();
  });

  test("lessons link to lesson viewer", async ({ page }) => {
    // Pre-dismiss the cookie banner, under parallel load it can slide in
    // mid-click and intercept the pointer event.
    await page.addInitScript(() => {
      localStorage.setItem("tc-cookie-consent", "declined");
    });
    await page.goto("/worlds/deep-orbit");
    await page
      .getByRole("link", { name: /^From JavaScript Arrays to Tensors, / })
      .first()
      .click();
    await expect(page).toHaveURL(
      /\/worlds\/deep-orbit\/foundations\/introduction-to-tensors/,
    );
  });

  test("returns 404 for unknown world", async ({ page }) => {
    const response = await page.goto("/worlds/nonexistent");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Module Overview Route", () => {
  // There is no standalone module page in the current design, the world
  // page's module map is the module overview. The /worlds/{slug}/{module}
  // route is a shim that redirects to the world page so in-app links
  // (lesson prerequisite gate, breadcrumb JSON-LD) never 404.
  test("module route redirects to the world page", async ({ page }) => {
    await page.goto("/worlds/deep-orbit/foundations");
    await expect(page).toHaveURL(/\/worlds\/deep-orbit$/);
    await expect(page.getByTestId("module-map")).toBeVisible();
  });

  test("unknown module 404s", async ({ page }) => {
    const response = await page.goto("/worlds/deep-orbit/nonexistent-module");
    expect(response?.status()).toBe(404);
  });

  test("coming-soon world module route 404s", async ({ page }) => {
    const response = await page.goto("/worlds/neon-protocol/foundations");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Lesson Viewer Page", () => {
  test("renders lesson content with title", async ({ page }) => {
    await page.goto("/worlds/deep-orbit/foundations/introduction-to-tensors");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "From JavaScript Arrays to Tensors",
      }),
    ).toBeVisible();
  });

  test("shows segmented step progress bar", async ({ page }) => {
    await page.goto("/worlds/deep-orbit/foundations/introduction-to-tensors");
    await expect(
      page.getByRole("button", { name: "Step 1: Briefing" }),
    ).toBeVisible();
    // Five steps since LESSON_STEPS_VERSION 2 merged Concept and Code
    // (apps/web/lib/lesson-phases.ts).
    const steps = page.getByRole("button", { name: /^Step \d/ });
    await expect(steps).toHaveCount(5);
    for (const [index, name] of [
      "Briefing",
      "Concept",
      "Challenge",
      "Takeaways",
      "Epilogue",
    ].entries()) {
      await expect(steps.nth(index)).toHaveAccessibleName(
        `Step ${index + 1}: ${name}`,
      );
    }
  });

  test("shows Continue button", async ({ page }) => {
    await page.goto("/worlds/deep-orbit/foundations/introduction-to-tensors");
    const continueButton = page.getByRole("button", { name: /continue/i });
    await expect(continueButton).toBeVisible();
  });

  test("hides marketing nav in focus mode", async ({ page }) => {
    await page.goto("/worlds/deep-orbit/foundations/introduction-to-tensors");
    await expect(page.getByTestId("site-nav")).toHaveCount(0);
  });

  test("marketing nav still renders on the world page", async ({ page }) => {
    await page.goto("/worlds/deep-orbit");
    await expect(page.getByTestId("site-nav")).toBeVisible();
  });

  test("shows a link back to the module map", async ({ page }) => {
    await page.goto("/worlds/deep-orbit/foundations/introduction-to-tensors");
    const backLink = page
      .getByRole("link", { name: /mission map|module|foundations/i })
      .first();
    await expect(backLink).toBeVisible();
  });

  test("returns 404 for unknown lesson", async ({ page }) => {
    const response = await page.goto(
      "/worlds/deep-orbit/foundations/nonexistent-lesson",
    );
    expect(response?.status()).toBe(404);
  });
});

test.describe("Lesson reading experience", () => {
  // Seed the persisted step BEFORE first render so the lesson lands on the
  // seeded step. These are the legacy six-step keys built from the lesson
  // SLUG. restoreLessonSteps (apps/web/lib/lesson-phases.ts) maps legacy
  // indexes 0-5 onto the five current steps: 1 and 2 restore as Concept,
  // 4 as Takeaways.
  const LESSON = "/worlds/deep-orbit/foundations/introduction-to-tensors";
  const STEP_KEY = "tc_step_deep-orbit_introduction-to-tensors";
  const MAX_KEY = "tc_step_max_deep-orbit_introduction-to-tensors";

  test("Concept step renders the reading column and underlines glossary terms", async ({
    page,
  }) => {
    await page.addInitScript(
      ({ stepKey, maxKey }) => {
        localStorage.setItem(stepKey, "1");
        localStorage.setItem(maxKey, "1");
      },
      { stepKey: STEP_KEY, maxKey: MAX_KEY },
    );
    await page.goto(LESSON, { waitUntil: "domcontentloaded" });

    // The Concept body is the reading column. Wait for it
    // before the right-slot check: the server renders the Briefing, which has
    // no right slot either, so that check proves nothing until the client has
    // restored the Concept step. A visible term chip proves the read rendered.
    await expect(
      page.locator('.lesson-step-content[data-layout="reading"]'),
    ).toBeVisible();
    await expect(page.getByTestId("lesson-right")).toHaveCount(0);
    const term = page
      .locator(".lesson-prose [data-glossary-term]:visible")
      .first();
    await expect(term).toBeVisible({ timeout: 15000 });
  });

  test("the Takeaways step lists the lesson's terms", async ({ page }) => {
    await page.addInitScript(
      ({ stepKey, maxKey }) => {
        localStorage.setItem(stepKey, "4");
        localStorage.setItem(maxKey, "4");
        localStorage.setItem("tc-cookie-consent", "declined");
      },
      { stepKey: STEP_KEY, maxKey: MAX_KEY },
    );
    await page.goto(LESSON, { waitUntil: "domcontentloaded" });
    // The terms list follows the recap, which waits for the recall card
    // (spec 2026-09-24, section 2): bail on the card first. Inside the Deep
    // Orbit lesson layout the bail button reads "Show an explanation"
    // (checked-recall-card.tsx, 2026-10-12).
    await page
      .getByRole("form", { name: "Knowledge check" })
      .getByRole("button", { name: "Show an explanation", exact: true })
      .click();
    // Since 2026-10-12 the Deep Orbit terms list is a collapsed "Review
    // lesson terms" disclosure with a term picker (deep-orbit-terms.tsx).
    const list = page.getByTestId("lesson-terms-list");
    await expect(list).toBeVisible({ timeout: 15000 });
    const heading = list.getByRole("heading", {
      level: 2,
      name: "Review lesson terms",
    });
    await expect(heading).toBeVisible();
    await heading.click();
    await expect(list).toHaveAttribute("open", "");
    expect(
      await list
        .getByRole("group", { name: "Choose a lesson term" })
        .getByRole("button")
        .count(),
    ).toBeGreaterThan(0);
    expect(
      await list.locator('[data-testid^="glossary-entry-"]').count(),
    ).toBeGreaterThan(0);
    await expect(
      list.locator('[data-testid^="glossary-entry-"]').first(),
    ).toBeVisible();
  });

  test("inline code renders as a chip in the prose (not a code block)", async ({
    page,
  }) => {
    await page.addInitScript(
      ({ stepKey, maxKey }) => {
        localStorage.setItem(stepKey, "1");
        localStorage.setItem(maxKey, "1");
      },
      { stepKey: STEP_KEY, maxKey: MAX_KEY },
    );
    await page.goto(LESSON, { waitUntil: "domcontentloaded" });

    // An inline <code> exists inside the prose that is NOT inside a <pre>.
    const inlineCode = page
      .locator(".lesson-prose :not(pre) > code:visible")
      .first();
    await expect(inlineCode).toBeVisible({ timeout: 15000 });
  });

  test("legacy Code position restores to Concept with its code", async ({
    page,
  }) => {
    // Legacy Code was index 2. It restores to the unified Concept.
    await page.addInitScript(
      ({ stepKey, maxKey }) => {
        localStorage.setItem(stepKey, "2");
        localStorage.setItem(maxKey, "2");
      },
      { stepKey: STEP_KEY, maxKey: MAX_KEY },
    );
    await page.goto(LESSON, { waitUntil: "domcontentloaded" });

    // Since 2026-10-19 the worked example (prepare-readings.js) lives in the
    // Concept workbench instead of the reading column below it.
    const workbench = page.getByTestId("lesson-workbench");
    await expect(workbench).toBeVisible();
    const code = workbench.locator("pre:visible").first();
    await expect(code).toBeVisible();
    await expect(code).toContainText(
      "const reading = tf.tensor(streamValues);",
    );
    await expect(page.getByTestId("lesson-right")).toHaveCount(0);
    await expect(page).toHaveURL(/#step-concept$/);
  });
});
