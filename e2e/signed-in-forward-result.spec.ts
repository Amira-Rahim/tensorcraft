import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertLocalReviewReady,
  completeAlexModule,
  loginReviewAccount,
  REVIEW_ACCOUNTS,
} from "./helpers/local-review";

// Auth traces, videos, and automatic screenshots stay off in the dedicated
// runner. Explicit screenshots contain only the result region.
test.beforeAll(assertLocalReviewReady);

const compiled = JSON.parse(
  readFileSync(resolve("packages/content/.velite/exercises.json"), "utf8"),
) as { slug: string; solutionCode: string }[];
const canonical = compiled.find(
  (exercise) => exercise.slug === "forward-pass",
)?.solutionCode;
if (!canonical)
  throw new Error("The compiled forward-pass exercise is missing.");

async function replaceCode(page: Page, code: string) {
  const editor = page.locator(".cm-content").first();
  await editor.click();
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+a" : "Control+a",
  );
  await page.keyboard.insertText(code);
  await expect(editor).toContainText(code, { useInnerText: true });
}

async function runCode(page: Page, passes: boolean) {
  const run = page.getByRole("button", { name: "Run Tests", exact: true });
  await run.click();
  await expect(run).toBeEnabled({ timeout: 90_000 });
  const checks = page.getByTestId("test-results-panel");
  await expect(checks).toBeVisible({ timeout: 90_000 });
  if (passes) {
    await expect(checks).toContainText("All tests passed!");
    await expect(
      page.getByRole("status").filter({ hasText: /^All 6 tests passed\.$/ }),
    ).toHaveCount(1);
  } else {
    await expect(checks).not.toContainText("All tests passed!");
  }
}

function value(viewer: Locator, label: string) {
  return viewer.getByText(label, { exact: true }).locator("..").locator("dd");
}

async function capturedRows(viewer: Locator, title: string) {
  return viewer
    .getByRole("region", { name: `${title}: result data`, exact: true })
    .locator("tbody tr")
    .evaluateAll((rows) =>
      rows.map((row) =>
        [...row.querySelectorAll("td")].map((cell) => cell.textContent!.trim()),
      ),
    );
}

async function inspectSecondRowThirdUnit(viewer: Locator) {
  await viewer
    .getByRole("combobox", { name: "Reading", exact: true })
    .selectOption("1");
  await viewer
    .getByRole("combobox", { name: "Output unit", exact: true })
    .selectOption("2");
  await expect(viewer.locator("[data-exercise-output-title]")).toHaveCount(2);
  const outputs = await capturedRows(viewer, "Your first forward pass");
  const weights = await capturedRows(
    viewer,
    "Weights used for this forward pass",
  );
  expect(outputs).toHaveLength(2);
  expect(weights.map((row) => row[0])).toEqual(["Input 1", "Input 2", "Bias"]);
  expect(outputs[1]!.slice(0, 3)).toEqual(["2", "3", "4"]);
  const input = [Number(outputs[1]![1]), Number(outputs[1]![2])];
  const kernelColumn = [Number(weights[0]![3]), Number(weights[1]![3])];
  const bias = Number(weights[2]![3]);
  const captured = Number(outputs[1]![5]);
  const expected =
    input[0]! * kernelColumn[0]! + input[1]! * kernelColumn[1]! + bias;
  for (const number of [...input, ...kernelColumn, bias, captured, expected]) {
    expect(Number.isFinite(number)).toBe(true);
  }
  const displayedSum = Number(
    await value(viewer, "Sum of captured terms and bias").innerText(),
  );
  const displayedOutput = Number(
    await value(viewer, "Captured output").innerText(),
  );
  const displayedDifference = Number(
    await value(viewer, "Difference from that sum").innerText(),
  );
  const displayTolerance = Math.max(1e-6, Math.abs(expected) * 1e-6);
  expect(Math.abs(displayedSum - expected)).toBeLessThanOrEqual(
    displayTolerance,
  );
  expect(Math.abs(displayedOutput - captured)).toBeLessThanOrEqual(
    displayTolerance,
  );
  expect(Math.abs(captured - expected)).toBeLessThan(1e-4);
  expect(displayedDifference).toBeLessThan(1e-4);
  await expect(
    viewer.getByRole("list", {
      name: "Captured inputs and their contributions",
      exact: true,
    }),
  ).toContainText("Input 1: 3 times captured weight");
  await expect(
    viewer.getByRole("list", {
      name: "Captured inputs and their contributions",
      exact: true,
    }),
  ).toContainText("Input 2: 4 times captured weight");
  await expect(viewer).toContainText(
    "Prediction accuracy needs labeled evaluation data.",
  );
  return {
    input,
    kernelColumn,
    bias,
    expected,
    captured,
    displayedSum,
    displayedOutput,
    displayedDifference,
  };
}

async function dismissNudge(page: Page) {
  const nudge = page.getByTestId("github-nudge-toast");
  if (await nudge.isVisible()) {
    await nudge.getByRole("button", { name: "Dismiss", exact: true }).click();
  }
}

async function accessibleResult(page: Page) {
  await dismissNudge(page);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual((await page.viewportSize())!.width);
  expect(
    (
      await new AxeBuilder({ page })
        .include('[aria-label="Explanation of your captured result"]')
        .analyze()
    ).violations,
  ).toEqual([]);
  await dismissNudge(page);
}

for (const { width, scheme } of [
  { width: 390, scheme: "light" },
  { width: 320, scheme: "dark" },
] as const) {
  test(`actual paid forward result traces captured operands at ${width}px ${scheme}`, async ({
    page,
  }, testInfo) => {
    await completeAlexModule("foundations");
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.addInitScript((owner) => {
      localStorage.setItem("tc-cookie-consent", "declined");
      localStorage.setItem("tc-script-skip", "1");
      localStorage.setItem(
        `tc_step_v2_deep-orbit_forward-pass:account:${owner}`,
        "2",
      );
      localStorage.setItem(
        `tc_step_max_v2_deep-orbit_forward-pass:account:${owner}`,
        "2",
      );
    }, REVIEW_ACCOUNTS.alex.id);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await loginReviewAccount(
      page,
      "alex",
      "/worlds/deep-orbit/neural-networks/forward-pass",
    );
    await expect(page).toHaveURL(/\/neural-networks\/forward-pass/);
    await expect(page.locator(".cm-content").first()).toBeVisible();
    const viewer = page.getByRole("region", {
      name: "Explanation of your captured result",
      exact: true,
    });

    await runCode(page, false);
    await expect(viewer).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Inspect result", exact: true }),
    ).toHaveCount(0);

    await replaceCode(page, canonical!);
    await runCode(page, true);
    await expect(
      viewer.getByRole("heading", {
        name: "One output from this forward pass",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Inspect result", exact: true })
      .click();
    const comparison = await inspectSecondRowThirdUnit(viewer);
    await accessibleResult(page);
    await viewer.screenshot({
      path: testInfo.outputPath(`forward-captured-${width}-${scheme}.png`),
    });

    await runCode(page, true);
    await expect(
      viewer.getByRole("combobox", { name: "Reading", exact: true }),
    ).toHaveValue("0");
    await expect(
      viewer.getByRole("combobox", { name: "Output unit", exact: true }),
    ).toHaveValue("0");
    await expect(page.getByTestId("challenge-passed-banner")).toHaveAttribute(
      "data-completion-state",
      "saved",
    );

    const partial = canonical!.replace(
      "return reading.expandDims(0);",
      "return reading.expandDims(0).add(1);",
    );
    expect(partial).not.toBe(canonical);
    await replaceCode(page, partial);
    await expect(viewer).toContainText("The editor has changed.");
    await runCode(page, false);
    await expect(viewer).toContainText("Some checks still need attention.");
    await expect(viewer).not.toContainText("The editor has changed.");
    await expect(page.getByTestId("exercise-result-verdict")).toContainText(
      "The values changed on the way through.",
    );
    const partialComparison = await inspectSecondRowThirdUnit(viewer);
    await accessibleResult(page);
    await viewer.screenshot({
      path: testInfo.outputPath(`forward-partial-${width}-${scheme}.png`),
    });

    await replaceCode(page, `${partial}\n// Edit after the captured run.\n`);
    await expect(viewer).toContainText("The editor has changed.");
    await expect(viewer).toContainText("Run it again to update these results.");
    expect(Number(await value(viewer, "Captured output").innerText())).toBe(
      partialComparison.displayedOutput,
    );
    await accessibleResult(page);
    expect(errors).toEqual([]);
    const metadataPath = testInfo.outputPath("forward-result-evidence.json");
    writeFileSync(
      metadataPath,
      JSON.stringify(
        {
          exercise: "forward-pass",
          width,
          scheme,
          scope:
            "Actual paid route with fictional local Alex, Foundations prerequisite seeded, and direct Challenge state. Canonical code runs in the actual browser Worker.",
          starterRejected: true,
          checksPassed: 6,
          capturedArtifacts: 2,
          comparison,
          partialComparison,
          rerunReset: true,
          completionSaved: true,
          partialFailure:
            "asBatch adds1 to every value, leaving useful forward/kernel captures before the later value-preservation check fails.",
          staleEdit: true,
          scopedAxeScans: 3,
          pageErrors: errors,
        },
        null,
        2,
      ),
    );
    await testInfo.attach("forward-result-evidence.json", {
      path: metadataPath,
      contentType: "application/json",
    });
  });
}
