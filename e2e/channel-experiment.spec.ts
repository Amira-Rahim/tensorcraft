import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const route = "/worlds/deep-orbit/foundations/tensor-shapes";
for (const [width, colorScheme] of [
  [1440, "dark"],
  [390, "light"],
  [320, "dark"],
] as const) {
  test(`channel experiment: real lesson at ${width}px ${colorScheme}`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.addInitScript(() =>
      localStorage.setItem("tc-cookie-consent", "declined"),
    );
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(route);
    // First-time deep links intentionally clamp to the visited lesson phase.
    // Enter Concept through the actual learner navigation, without seeding progress.
    // The server HTML already shows Continue, but a click before hydration
    // does nothing (flaky on Linux CI, 2026-10-25). The Briefing marks the
    // client mount by resolving its scene.
    await expect(page.locator("[data-script-state='done']")).toBeAttached();
    // The lesson nav button reads "Continue" with no arrow since 2026-10-19.
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    const experiment = page.getByTestId("channel-layout-experiment");
    await expect(experiment).toHaveCount(1);
    await expect(experiment).toBeVisible();
    await experiment
      .getByLabel("Which four readings go in the second row?", { exact: true })
      .fill("3,18,7,8");
    await experiment
      .getByRole("button", { name: "Check prediction", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    // Since 2026-10-16 the announced feedback opens with a "Correct!" verdict,
    // followed by the explanation.
    const predictionFeedback = experiment
      .getByRole("status")
      .filter({ hasText: "The second row is [3, 18, 7, 8]." });
    await expect(predictionFeedback).toHaveAttribute(
      "data-feedback-state",
      "correct",
    );
    await expect(predictionFeedback).toContainText("Correct!");
    await expect(
      experiment.getByText(
        "The second row is [3, 18, 7, 8]. These are the four sensors’ readings at Time 2.",
        { exact: true },
      ),
    ).toBeVisible();
    await experiment
      .getByRole("button", { name: "Run reshape", exact: true })
      .click();
    await expect(
      experiment.getByTestId("channel-result").getByRole("status"),
    ).toContainText("[2, 20, 5]");
    await experiment
      .getByRole("button", { name: "Run transpose", exact: true })
      .click();
    await expect(
      experiment.getByTestId("channel-result").getByRole("status"),
    ).toContainText("[2, 3, 4]");
    await experiment.getByLabel("Follow a sensor").selectOption("2");
    if (width === 1440) {
      await page.setViewportSize({ width: 390, height: 900 });
      await expect(experiment.getByLabel("Follow a sensor")).toHaveValue("2");
      await page.setViewportSize({ width, height: 900 });
      // Renamed on 2026-10-16 (02-tensor-shapes.mdx).
      await page
        .getByText("Optional: images, extra axes, and memory", {
          exact: true,
        })
        .click();
      const glossaryTerm = page.getByRole("button", {
        name: "rank",
        exact: true,
      });
      await glossaryTerm.click();
      await expect(experiment.getByLabel("Follow a sensor")).toHaveValue("2");
    }
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(experiment).toHaveCount(0);
    await page
      .getByRole("button", { name: "Step 2: Concept", exact: true })
      .click();
    await expect(experiment.getByLabel("Follow a sensor")).toHaveValue("2");
    await page.reload();
    await expect(
      experiment.getByRole("button", { name: "Run transpose", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(experiment.getByLabel("Follow a sensor")).toHaveValue("2");
    const layout = await experiment.evaluate((element) => ({
      width: element.clientWidth,
      scrollWidth: element.scrollWidth,
      pageWidth: document.documentElement.clientWidth,
      pageScroll: document.documentElement.scrollWidth,
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width + 1);
    expect(layout.pageScroll).toBeLessThanOrEqual(layout.pageWidth + 1);
    await experiment.screenshot({
      path: testInfo.outputPath(`worked-${width}-${colorScheme}.png`),
    });
    const a11y = await new AxeBuilder({ page })
      .include('[data-testid="channel-layout-experiment"]')
      .analyze();
    expect(a11y.violations).toEqual([]);
    // "Try a new example" became "Try the next selection" on 2026-10-17.
    await experiment
      .getByRole("button", { name: "Try the next selection", exact: true })
      .click();
    await experiment.getByLabel("Reshape to [3, 2]", { exact: true }).check();
    await experiment
      .getByLabel("Sensor B’s two readings, from earliest to latest", {
        exact: true,
      })
      .fill("20,21");
    await experiment
      .getByRole("button", { name: "Check my answer", exact: true })
      .click();
    // Correct readings with the wrong operation: the verdict names the
    // incorrect part (2026-10-16), and the guidance explains why reshape fails.
    const checkFeedback = experiment
      .getByRole("status")
      .filter({ hasText: "The operation is incorrect." });
    await expect(checkFeedback).toHaveAttribute(
      "data-feedback-state",
      "incorrect",
    );
    await expect(checkFeedback).toContainText(
      "Not quite. The operation is incorrect.",
    );
    await expect(
      experiment.getByText(
        /Your sensor readings are correct\. Reshape gives you three rows of two, but mixes the sensors’ readings\./,
      ),
    ).toBeVisible();
    await experiment
      .getByLabel("Transpose: turn columns into rows", { exact: true })
      .check();
    await experiment
      .getByRole("button", { name: "Check my answer", exact: true })
      .click();
    await expect(
      experiment.getByText(
        /Both answers are correct\. You answered without help/,
      ),
    ).toBeVisible();
    await expect(
      experiment.getByText(
        /Your first answer on the next selection: incorrect, without help/,
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Step 5: Epilogue", exact: true }),
    ).toBeDisabled();
    await experiment.screenshot({
      path: testInfo.outputPath(`check-${width}-${colorScheme}.png`),
    });
    if (width === 320) {
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      await experiment.screenshot({
        path: testInfo.outputPath("check-320-text-200.png"),
      });
      // The next selection's table, captioned "Another selection from
      // Demir’s recording" since 2026-10-17.
      const enlargedTable = experiment.getByRole("region", {
        name: /^Another selection from Demir’s recording/,
      });
      await enlargedTable.focus();
      await page.keyboard.press("ArrowRight");
      await expect
        .poll(() => enlargedTable.evaluate((element) => element.scrollLeft))
        .toBeGreaterThan(0);
      await enlargedTable.screenshot({
        path: testInfo.outputPath("table-320-text-200.png"),
      });
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth + 1,
        ),
      ).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}
