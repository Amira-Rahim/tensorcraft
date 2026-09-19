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
    await page.goto("/worlds/deep-orbit");
    const picker = page.getByRole("region", {
      name: "Choose your way through Deep Orbit",
    });
    await expect(picker).toBeVisible();
    const preview = page.getByRole("region", {
      name: "Take the work outside the course",
    });
    await expect(preview).toContainText("Maintainer demonstration");
    await expect(preview).toContainText("0.656");
    await picker.screenshot({
      path: testInfo.outputPath(`route-${width}.png`),
    });
    await preview.screenshot({
      path: testInfo.outputPath(`project-${width}.png`),
    });
    const a11y = await new AxeBuilder({ page })
      .include(".learning-route-picker")
      .include('[aria-labelledby="course-project-preview-title"]')
      .analyze();
    expect(a11y.violations).toEqual([]);
    await picker.getByRole("button", { name: /I know the basics/ }).click();
    await page.reload();
    await expect(
      picker.getByRole("button", { name: /I know the basics/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await picker
      .getByRole("link", { name: "Open the runtime challenge" })
      .click();
    await expect(page).toHaveURL(
      /\/pricing\?locked=deep-orbit&module=browser-runtimes/,
    );
    await page.goto("/worlds/deep-orbit");
    await picker
      .getByRole("link", { name: "Try the free channel experiment" })
      .click();
    const experiment = page.getByTestId("channel-layout-experiment");
    await expect(experiment).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Step 2: Concept", exact: true }),
    ).toHaveAttribute("aria-current", "step");
    await experiment.getByLabel(/Predict channel/).fill("0,1,2");
    await experiment
      .getByRole("button", { name: "Check prediction", exact: true })
      .click();
    await experiment
      .getByRole("button", { name: "Run reshape", exact: true })
      .click();
    await expect(experiment.getByTestId("channel-result")).toContainText(
      "[0, 1, 2]",
    );
    await experiment
      .getByRole("button", { name: "Run transpose", exact: true })
      .click();
    await expect(experiment.getByTestId("channel-result")).toContainText(
      "[0, 4, 8]",
    );
    await experiment
      .getByRole("button", { name: "Try a different packet", exact: true })
      .click();
    await experiment.getByLabel("Transpose the axes", { exact: true }).check();
    await experiment
      .getByLabel("Channel 1 values, in time order", { exact: true })
      .fill("20,21");
    await experiment
      .getByRole("button", { name: "Check new packet", exact: true })
      .click();
    await expect(
      experiment.getByText(/First changed-case attempt: correct/),
    ).toBeVisible();
    await page.getByRole("button", { name: "Continue →", exact: true }).click();
    await expect(experiment).toHaveCount(0);
    const reference = page.locator("details").filter({
      has: page.getByText(
        "Reference: flat order, reshape code, and the full archive example",
        { exact: true },
      ),
    });
    await expect(reference).toHaveAttribute("open", "");
    await expect(
      reference.getByText("tensor-shapes.ts", { exact: true }),
    ).toBeVisible();
    await expect(
      reference.getByText("garbled-channels.ts", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Step 6: Consequence", exact: true }),
    ).toBeDisabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
    await testInfo.attach("scripted-path-time.json", {
      body: JSON.stringify({
        durationMs: Date.now() - started,
        includes:
          "navigation, wrong prediction, transforms, changed packet, paywall and code reference",
        excludes: "human reading and thinking time; this is not learner timing",
      }),
      contentType: "application/json",
    });
  });
}
