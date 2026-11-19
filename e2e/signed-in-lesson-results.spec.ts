import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertLocalReviewReady,
  completeAlexModule,
  loginReviewAccount,
  REVIEW_ACCOUNTS,
} from "./helpers/local-review";

// The dedicated config records no auth traces, videos, or page screenshots.
// Explicit screenshots below include only captured exercise results.
test.beforeAll(assertLocalReviewReady);

const exercises = JSON.parse(
  readFileSync(resolve("packages/content/.velite/exercises.json"), "utf8"),
) as { slug: string; solutionCode: string }[];

function solution(slug: string) {
  const exercise = exercises.find((entry) => entry.slug === slug);
  if (!exercise) throw new Error(`Missing compiled exercise ${slug}.`);
  return exercise.solutionCode;
}

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
  if (passes) await expect(checks).toContainText("All tests passed!");
  else await expect(checks).not.toContainText("All tests passed!");
}

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    })),
  ).toEqual({
    viewport: (await page.viewportSize())!.width,
    document: (await page.viewportSize())!.width,
  });
}

async function accessibleResult(page: Page) {
  const nudge = page.getByTestId("github-nudge-toast");
  if (await nudge.isVisible()) {
    await nudge.getByRole("button", { name: "Dismiss", exact: true }).click();
  }
  await noOverflow(page);
  expect(
    (
      await new AxeBuilder({ page })
        .include('[aria-label="Explanation of your captured result"]')
        .analyze()
    ).violations,
  ).toEqual([]);
  if (await nudge.isVisible()) {
    await nudge.getByRole("button", { name: "Dismiss", exact: true }).click();
  }
}

function readingValue(viewer: Locator, label: string) {
  return viewer.getByText(label, { exact: true }).locator("..").locator("dd");
}

for (const { width, scheme } of [
  { width: 390, scheme: "light" },
  { width: 320, scheme: "dark" },
] as const) {
  test(`actual free reshape result keeps linked output at ${width}px ${scheme}`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.setItem("tc-cookie-consent", "declined");
      localStorage.setItem("tc-script-skip", "1");
      localStorage.setItem("tc_step_v2_deep-orbit_tensor-shapes", "2");
      localStorage.setItem("tc_step_max_v2_deep-orbit_tensor-shapes", "2");
    });
    await page.goto("/worlds/deep-orbit/foundations/tensor-shapes");
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

    const canonical = solution("reshape-tensor");
    await replaceCode(page, canonical);
    await runCode(page, true);
    await expect(viewer).toBeVisible();
    await page
      .getByRole("link", { name: "Inspect result", exact: true })
      .click();
    await viewer
      .getByRole("combobox", { name: "Sensor", exact: true })
      .selectOption("3");
    await viewer
      .getByRole("combobox", { name: "Selected moment", exact: true })
      .selectOption("1");
    await expect(
      readingValue(viewer, "Value in supplied recording"),
    ).toHaveText("8");
    await expect(readingValue(viewer, "Value in captured chart")).toHaveText(
      "8",
    );
    await expect(
      readingValue(viewer, "Index in supplied flat list"),
    ).toHaveText("7");
    await expect(
      readingValue(viewer, "Position in captured chart data"),
    ).toHaveText("Sensor row 3, moment column 1");
    await expect(
      viewer.getByRole("button", { name: "Sensor D", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await viewer
      .getByRole("button", { name: /D at 1 8.*flat index 3/ })
      .focus();
    await page.keyboard.press("Enter");
    await expect(
      readingValue(viewer, "Index in supplied flat list"),
    ).toHaveText("3");
    await expect(
      viewer.getByRole("combobox", { name: "Selected moment", exact: true }),
    ).toHaveValue("0");
    await viewer.getByText("Read the values", { exact: true }).click();
    await accessibleResult(page);
    await viewer.screenshot({
      path: testInfo.outputPath(`reshape-linked-${width}.png`),
    });

    await runCode(page, true);
    await expect(
      viewer.getByRole("combobox", { name: "Sensor", exact: true }),
    ).toHaveValue("0");
    await expect(
      viewer.getByRole("combobox", { name: "Selected moment", exact: true }),
    ).toHaveValue("0");
    await expect(page.getByTestId("challenge-passed-banner")).toHaveAttribute(
      "data-completion-state",
      "saved",
    );

    const partial = canonical.replace(
      "const step1 = grid.arraySync()[1];",
      "const step1 = grid.arraySync()[0];",
    );
    expect(partial).not.toBe(canonical);
    await replaceCode(page, partial);
    await expect(viewer).toContainText("The editor has changed.");
    await runCode(page, false);
    await expect(viewer).toContainText("Some checks still need attention.");
    await expect(viewer).not.toContainText("The editor has changed.");
    await expect(readingValue(viewer, "Value in captured chart")).toHaveText(
      "2",
    );
    await expect(page.getByTestId("exercise-result-verdict")).toContainText(
      "second row",
    );
    await accessibleResult(page);
    await viewer.screenshot({
      path: testInfo.outputPath(`reshape-partial-${width}.png`),
    });
    await replaceCode(page, `${partial}\n// Edit after the captured run.\n`);
    await expect(viewer).toContainText("The editor has changed.");
    await expect(viewer).toContainText("Run it again to update these results.");
    await accessibleResult(page);
    expect(errors).toEqual([]);
    await testInfo.attach("result-evidence.json", {
      body: JSON.stringify(
        {
          exercise: "reshape-tensor",
          width,
          scheme,
          scope:
            "Actual free route, browser Worker, canonical code and deliberate wrong second-row selection.",
          starterRejected: true,
          linkedDuplicateIndices: [7, 3],
          rerunReset: true,
          completionSaved: true,
          usefulPartialOutput: true,
          staleEdit: true,
          pageErrors: errors,
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
  });

  test(`actual paid gradient result preserves measured comparison at ${width}px ${scheme}`, async ({
    page,
  }, testInfo) => {
    await completeAlexModule("foundations");
    await completeAlexModule("neural-networks");
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.addInitScript((owner) => {
      localStorage.setItem("tc-cookie-consent", "declined");
      localStorage.setItem("tc-script-skip", "1");
      localStorage.setItem(
        `tc_step_v2_deep-orbit_backpropagation:account:${owner}`,
        "2",
      );
      localStorage.setItem(
        `tc_step_max_v2_deep-orbit_backpropagation:account:${owner}`,
        "2",
      );
    }, REVIEW_ACCOUNTS.alex.id);
    await loginReviewAccount(
      page,
      "alex",
      "/worlds/deep-orbit/training-loop/backpropagation",
    );
    await expect(page).toHaveURL(/\/training-loop\/backpropagation/);
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

    const canonical = solution("backprop-chain");
    await replaceCode(page, canonical);
    await runCode(page, true);
    await expect(viewer).toBeVisible();
    const variable = viewer.getByRole("combobox", {
      name: "Variable",
      exact: true,
    });
    await expect(variable.locator("option")).toHaveCount(3);
    await variable.selectOption("2");
    expect(
      Number(
        await readingValue(viewer, "Captured automatic gradient").innerText(),
      ),
    ).toBeCloseTo(1.5, 6);
    expect(
      Number(
        await readingValue(viewer, "Captured numerical estimate").innerText(),
      ),
    ).toBeCloseTo(1.5, 1);
    await expect(
      readingValue(viewer, "Automatic forward calculations"),
    ).toHaveText("1");
    await expect(
      readingValue(viewer, "Numerical forward calculations"),
    ).toHaveText("6");
    await expect(viewer).toContainText(
      "Numerical estimation temporarily changes a variable and must restore it afterward.",
    );
    await accessibleResult(page);
    await viewer.screenshot({
      path: testInfo.outputPath(`gradients-compared-${width}.png`),
    });

    await runCode(page, true);
    await expect(variable).toHaveValue("0");
    expect(
      Number(
        await readingValue(viewer, "Captured automatic gradient").innerText(),
      ),
    ).toBeCloseTo(Math.cos(1.5) + 0.25, 6);
    await expect(page.getByTestId("challenge-passed-banner")).toHaveAttribute(
      "data-completion-state",
      "saved",
    );
    const partial = canonical.replace(
      /try \{\s*variable\.assign\(tf\.scalar\(saved \+ 0\.001\)\);\s*const bumped = fn\(\)\.dataSync\(\)\[0\];\s*return \(bumped - base\) \/ 0\.001;\s*\}\s*finally \{\s*variable\.assign\(tf\.scalar\(saved\)\);\s*\}/,
      "variable.assign(tf.scalar(saved + 0.001));\nconst bumped = fn().dataSync()[0];\nvariable.assign(tf.scalar(saved));\nreturn (bumped - base) / 0.001;",
    );
    expect(partial).not.toBe(canonical);
    await replaceCode(page, partial);
    await expect(viewer).toContainText("The editor has changed.");
    await runCode(page, false);
    await expect(viewer).toContainText("Some checks still need attention.");
    await expect(viewer).not.toContainText("The editor has changed.");
    await expect(page.getByTestId("exercise-result-verdict")).toContainText(
      "Restore the variable passed to numericGradOf",
    );
    await expect(
      readingValue(viewer, "Automatic forward calculations"),
    ).toHaveText("1");
    await expect(
      readingValue(viewer, "Numerical forward calculations"),
    ).toHaveText("6");
    await accessibleResult(page);
    await viewer.screenshot({
      path: testInfo.outputPath(`gradients-partial-${width}.png`),
    });
    await replaceCode(page, `${partial}\n// Edit after the captured run.\n`);
    await expect(viewer).toContainText("The editor has changed.");
    await expect(viewer).toContainText("Run it again to update these results.");
    await accessibleResult(page);
    expect(errors).toEqual([]);
    await testInfo.attach("result-evidence.json", {
      body: JSON.stringify(
        {
          exercise: "backprop-chain",
          width,
          scheme,
          scope:
            "Actual paid route with fictional local account and seeded prerequisite completion. Real browser Worker runs canonical code and a missing-finally variant.",
          starterRejected: true,
          automaticCalls: 1,
          numericalCalls: 6,
          thirdAutomaticGradient: 1.5,
          rerunReset: true,
          completionSaved: true,
          usefulPartialOutput: true,
          staleEdit: true,
          pageErrors: errors,
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
  });
}
