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
    await expect(
      page.getByText(/introduction to tensors/i).first(),
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
    await expect(page.getByText(/min/i).first()).toBeVisible();
  });

  test("lessons link to lesson viewer", async ({ page }) => {
    // Pre-dismiss the cookie banner, under parallel load it can slide in
    // mid-click and intercept the pointer event.
    await page.addInitScript(() => {
      localStorage.setItem("tc-cookie-consent", "declined");
    });
    await page.goto("/worlds/deep-orbit");
    await page
      .getByRole("link", { name: /introduction to tensors/i })
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
      page.getByText(/introduction to tensors/i).first(),
    ).toBeVisible();
  });

  test("shows segmented step progress bar", async ({ page }) => {
    await page.goto("/worlds/deep-orbit/foundations/introduction-to-tensors");
    await expect(
      page.getByRole("button", { name: "Step 1: Briefing" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^Step \d/ })).toHaveCount(6);
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
  // Concept step (index 1). The storage key uses the slugified lesson TITLE
  // ("Introduction to Tensors" -> introduction-to-tensors), which happens to
  // match the slug here (see getStorageKey in lesson-steps.tsx).
  const LESSON = "/worlds/deep-orbit/foundations/introduction-to-tensors";
  const STEP_KEY = "tc_step_deep-orbit_introduction-to-tensors";
  const MAX_KEY = "tc_step_max_deep-orbit_introduction-to-tensors";

  test("Concept step underlines glossary terms and lists them in the rail", async ({
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

    // Right region on the Concept step is a rail (not a pane).
    const right = page.getByTestId("lesson-right");
    await expect(right).toHaveAttribute("data-kind", "rail");

    // At least one concept term is underlined in the prose.
    const term = page.locator(".lesson-prose [data-glossary-term]").first();
    await expect(term).toBeVisible({ timeout: 15000 });

    // The glossary rail lists entries.
    const railEntries = page.locator('[data-testid^="glossary-entry-"]');
    await expect(railEntries.first()).toBeVisible();
    expect(await railEntries.count()).toBeGreaterThan(0);
  });

  test("clicking a glossary term activates its rail entry", async ({
    page,
  }) => {
    let lastSignature = "";
    await page.addInitScript(
      ({ stepKey, maxKey }) => {
        localStorage.setItem(stepKey, "1");
        localStorage.setItem(maxKey, "1");
        // Every sibling spec declines consent; without this the banner
        // covers the prose and the click below never lands.
        localStorage.setItem("tc-cookie-consent", "declined");
      },
      { stepKey: STEP_KEY, maxKey: MAX_KEY },
    );
    await page.goto(LESSON, { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("lesson-right")).toHaveAttribute(
      "data-kind",
      /.+/,
    );

    // Glossary buttons are injected on the client, and the step partition
    // then hides every paragraph that does not belong to the current step,
    // so the visible set keeps changing for a moment after load. A term
    // caught mid-settle is about to be hidden, and clicking it leaves the
    // rail untouched. Wait until the visible set stops moving.
    const visibleTerms = page.locator(
      ".lesson-prose [data-glossary-term]:visible",
    );
    await expect
      .poll(
        async () => {
          const count = await visibleTerms.count();
          const first =
            count > 0
              ? await visibleTerms.first().getAttribute("data-glossary-term")
              : null;
          const signature = `${count}:${first ?? ""}`;
          const settled = count > 0 && signature === lastSignature;
          lastSignature = signature;
          return settled;
        },
        { timeout: 15000, intervals: [250] },
      )
      .toBe(true);

    const term = visibleTerms.first();
    await expect(term).toBeVisible({ timeout: 15000 });

    // Read the term value off the clicked element, then assert the rail
    // entry with that exact term becomes active.
    const termValue = await term.getAttribute("data-glossary-term");
    expect(termValue).toBeTruthy();

    const entry = page.getByTestId(`glossary-entry-${termValue}`);
    // Wait for the rail entry to exist (proves the client component is
    // hydrated) before clicking, so the click handler is attached.
    await expect(entry).toBeVisible({ timeout: 15000 });
    await expect(entry).toHaveAttribute("data-active", "false");

    await term.click();

    await expect(entry).toHaveAttribute("data-active", "true", {
      timeout: 15000,
    });
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
    const inlineCode = page.locator(".lesson-prose :not(pre) > code").first();
    await expect(inlineCode).toBeVisible({ timeout: 15000 });
  });

  test("Code step swaps the right rail for a work pane", async ({ page }) => {
    // Code is step index 2. Seed maxStep high enough that the step is reachable.
    await page.addInitScript(
      ({ stepKey, maxKey }) => {
        localStorage.setItem(stepKey, "2");
        localStorage.setItem(maxKey, "2");
      },
      { stepKey: STEP_KEY, maxKey: MAX_KEY },
    );
    await page.goto(LESSON, { waitUntil: "domcontentloaded" });

    const right = page.getByTestId("lesson-right");
    await expect(right).toHaveAttribute("data-kind", "pane", {
      timeout: 15000,
    });
  });
});
