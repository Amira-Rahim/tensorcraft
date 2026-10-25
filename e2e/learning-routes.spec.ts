import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const [width, colorScheme] of [
  [1440, "dark"],
  [390, "light"],
] as const) {
  test(`first-session route, references and access at ${width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const started = Date.now();
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.addInitScript(() =>
      localStorage.setItem("tc-cookie-consent", "declined"),
    );
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Prospects never see the route picker or readiness check, even
    // collapsed (owner, 2026-09-20); the project brief still closes the page.
    await page.goto("/worlds/deep-orbit");
    await expect(
      page.getByRole("region", { name: "Choose your way through Deep Orbit" }),
    ).toHaveCount(0);
    await expect(page.getByText("Course preferences")).toHaveCount(0);
    await page.locator("summary", { hasText: "Project brief" }).click();
    // Retitled on 2026-10-19 (course-project-preview.tsx). The preview must
    // still mark the recorded reading as our demonstration run, separate
    // from the learner's work (CLAUDE.md, 2026-10-18).
    const preview = page.getByRole("region", {
      name: "Your independent browser project",
    });
    await expect(preview).toBeVisible();
    await expect(preview).toContainText(
      "Here is one validation reading from our demonstration run, separate from the work you’ll do",
    );
    await expect(preview).toContainText("0.656");
    await preview.screenshot({
      path: testInfo.outputPath(`project-${width}.png`),
    });
    const a11y = await new AxeBuilder({ page })
      .include('[aria-labelledby="course-project-preview-title"]')
      .analyze();
    expect(a11y.violations).toEqual([]);
    // A paid challenge link still lands a guest on the price, not the lesson.
    await page.goto(
      "/worlds/deep-orbit/browser-runtimes/why-the-browser?start=challenge",
    );
    await expect(page).toHaveURL(
      /\/pricing\?locked=deep-orbit&module=browser-runtimes/,
    );
    // The free experiment is reachable directly from the first module.
    await page.goto(
      "/worlds/deep-orbit/foundations/tensor-shapes?start=experiment",
    );
    const experiment = page.getByTestId("channel-layout-experiment");
    await expect(experiment).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Step 2: Concept", exact: true }),
    ).toHaveAttribute("aria-current", "step");
    await experiment
      .getByLabel("Which four readings go in the second row?", { exact: true })
      .fill("2,20,5,8");
    await experiment
      .getByRole("button", { name: "Check prediction", exact: true })
      .click();
    await expect(
      experiment
        .getByRole("status")
        .filter({ hasText: "Not quite. That’s not the second row." }),
    ).toHaveAttribute("data-feedback-state", "incorrect");
    await experiment
      .getByRole("button", { name: "Run reshape", exact: true })
      .click();
    await expect(experiment.getByTestId("channel-result")).toContainText(
      "[2, 20, 5]",
    );
    await experiment
      .getByRole("button", { name: "Run transpose", exact: true })
      .click();
    await expect(experiment.getByTestId("channel-result")).toContainText(
      "[2, 3, 4]",
    );
    // "Try a new example" became "Try the next selection" on 2026-10-17.
    await experiment
      .getByRole("button", { name: "Try the next selection", exact: true })
      .click();
    await experiment
      .getByLabel("Transpose: turn columns into rows", { exact: true })
      .check();
    await experiment
      .getByLabel("Sensor B’s two readings, from earliest to latest", {
        exact: true,
      })
      .fill("20,21");
    await experiment
      .getByRole("button", { name: "Check my answer", exact: true })
      .click();
    await expect(
      experiment.getByText(
        /Your first answer on the next selection: correct, without help/,
      ),
    ).toBeVisible();
    // The optional reference was renamed and its two sections split into
    // three on 2026-10-16 (02-tensor-shapes.mdx).
    const reference = page.locator("details").filter({
      has: page.getByText("Optional: images, extra axes, and memory", {
        exact: true,
      }),
    });
    await reference.locator("summary").click();
    await expect(reference).toHaveAttribute("open", "");
    for (const name of [
      "The same idea works for images",
      "What happens to the data in memory?",
      "Swapping axes in a bigger tensor",
    ]) {
      await expect(
        reference.getByRole("heading", { name, exact: true }),
      ).toBeVisible();
    }
    await expect(
      page.getByRole("button", { name: "Step 5: Epilogue", exact: true }),
    ).toBeDisabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    // The lesson nav button reads "Continue" with no arrow since 2026-10-19.
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(experiment).toHaveCount(0);
    await expect(
      page.getByRole("group", { name: "Step 3 of 5: Challenge", exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
    await testInfo.attach("scripted-path-time.json", {
      body: JSON.stringify({
        durationMs: Date.now() - started,
        includes:
          "navigation, project brief, guest paywall, wrong prediction, transforms, next sensor selection and optional reference",
        excludes: "human reading and thinking time; this is not learner timing",
      }),
      contentType: "application/json",
    });
  });
}
