import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertLocalReviewReady,
  completeAlexModule,
  loginReviewAccount,
  REVIEW_ACCOUNTS,
} from "./helpers/local-review";

test.beforeAll(assertLocalReviewReady);
const compiled = JSON.parse(
  readFileSync(resolve("packages/content/.velite/exercises.json"), "utf8"),
) as { slug: string; solutionCode: string }[];
const cases = [
  {
    slug: "mse-loss",
    lesson: "loss-functions",
    width: 390,
    scheme: "light",
    checks: 8,
    artifacts: 3,
  },
  {
    slug: "gradient-step",
    lesson: "gradient-descent",
    width: 320,
    scheme: "dark",
    checks: 6,
    artifacts: 3,
  },
  {
    slug: "training-loop-exercise",
    lesson: "training-loop",
    width: 390,
    scheme: "light",
    checks: 6,
    artifacts: 2,
  },
] as const;

async function replaceCode(page: Page, code: string) {
  const editor = page.locator(".cm-content").first();
  await editor.click();
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+a" : "Control+a",
  );
  await page.keyboard.insertText(code);
  // CodeMirror virtualizes long documents, so the DOM omits offscreen lines.
  // The real Worker verdict below checks that the submitted source executes.
  await expect(editor).toContainText(code.trim().split("\n").at(-1)!.trim(), {
    useInnerText: true,
  });
}
async function runCode(page: Page, passes: boolean) {
  const run = page.getByRole("button", { name: "Run Tests", exact: true });
  await run.click();
  await expect(run).toBeEnabled({ timeout: 120_000 });
  const checks = page.getByTestId("test-results-panel");
  await expect(checks).toBeVisible();
  if (passes) await expect(checks).toContainText("All tests passed!");
  else await expect(checks).not.toContainText("All tests passed!");
}

for (const item of cases) {
  test(`actual paid ${item.slug} result uses captured operands at ${item.width}px`, async ({
    page,
  }, testInfo) => {
    const canonical = compiled.find(
      (exercise) => exercise.slug === item.slug,
    )?.solutionCode;
    if (!canonical) throw Error("Missing compiled exercise");
    await completeAlexModule("foundations");
    await completeAlexModule("neural-networks");
    await page.setViewportSize({ width: item.width, height: 900 });
    await page.emulateMedia({
      colorScheme: item.scheme,
      reducedMotion: "reduce",
    });
    await page.addInitScript(
      ({ owner, lesson }) => {
        localStorage.setItem("tc-cookie-consent", "declined");
        localStorage.setItem("tc-script-skip", "1");
        localStorage.setItem(
          `tc_step_v2_deep-orbit_${lesson}:account:${owner}`,
          "2",
        );
        localStorage.setItem(
          `tc_step_max_v2_deep-orbit_${lesson}:account:${owner}`,
          "2",
        );
      },
      { owner: REVIEW_ACCOUNTS.alex.id, lesson: item.lesson },
    );
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await loginReviewAccount(
      page,
      "alex",
      `/worlds/deep-orbit/training-loop/${item.lesson}`,
    );
    await expect(page.locator(".cm-content").first()).toBeVisible();
    const viewer = page.getByRole("region", {
      name: "Explanation of your captured result",
      exact: true,
    });
    const value = (label: string) =>
      viewer.getByText(label, { exact: true }).locator("..").locator("dd");
    await replaceCode(page, canonical);
    await runCode(page, true);
    await expect(viewer).toBeVisible();
    await expect(viewer.locator("[data-exercise-output-title]")).toHaveCount(
      item.artifacts,
    );
    await page
      .getByRole("link", { name: "Inspect result", exact: true })
      .click();
    const evidence: Record<string, unknown> = {
      exercise: item.slug,
      width: item.width,
      scheme: item.scheme,
      canonicalChecks: item.checks,
      artifacts: item.artifacts,
    };
    if (item.slug === "mse-loss") {
      await expect(value("Your returned batch MSE")).toHaveText("0.15");
      await viewer
        .getByRole("combobox", { name: "Loss probe", exact: true })
        .selectOption("bce");
      await viewer
        .getByRole("combobox", { name: "Confidence case", exact: true })
        .selectOption("1");
      await expect(value("Captured logit")).toHaveText("-3");
      expect(
        Number(await value("Your returned batch cross-entropy").innerText()),
      ).toBeGreaterThan(3);
    } else if (item.slug === "gradient-step") {
      await viewer
        .getByRole("combobox", { name: "Captured update", exact: true })
        .selectOption("1");
      expect(
        Number(await value("Weight before this update").innerText()),
      ).toBeCloseTo(3.2, 5);
      expect(
        Number(await value("Your weight after this update").innerText()),
      ).toBeCloseTo(2.56, 5);
      expect(
        Number(await value("Your loss after this update").innerText()),
      ).toBeCloseTo(6.5536, 4);
    } else {
      const epochs = Number(await value("Completed epochs").innerText());
      const samples = viewer.getByRole("combobox", {
        name: "Captured sample epoch",
        exact: true,
      });
      await expect(samples.locator("option")).toHaveCount(Math.min(64, epochs));
      await samples.selectOption(String(Math.min(64, epochs) - 1));
      const returned = await value("Your returned diagnosis").innerText();
      await expect(
        value("Reference from the captured full-window means"),
      ).toHaveText(returned);
      evidence.completedEpochs = epochs;
      evidence.returned = returned;
    }
    await expect(page.getByTestId("challenge-passed-banner")).toHaveAttribute(
      "data-completion-state",
      "saved",
    );
    const checkBrowser = async () => {
      const nudge = page.getByTestId("github-nudge-toast");
      const dismissNudge = async () => {
        if (await nudge.isVisible())
          await nudge
            .getByRole("button", { name: "Dismiss", exact: true })
            .click();
      };
      await dismissNudge();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(item.width);
      expect(
        (
          await new AxeBuilder({ page })
            .include('[aria-label="Explanation of your captured result"]')
            .analyze()
        ).violations,
      ).toEqual([]);
      await dismissNudge();
    };
    await checkBrowser();
    await viewer.screenshot({
      path: testInfo.outputPath(`${item.slug}-actual.png`),
      caret: "initial",
    });
    await runCode(page, true);
    const resetControl =
      item.slug === "mse-loss"
        ? "Loss probe"
        : item.slug === "gradient-step"
          ? "Captured update"
          : "Captured sample epoch";
    await expect(
      viewer.getByRole("combobox", { name: resetControl, exact: true }),
    ).toHaveValue(item.slug === "mse-loss" ? "mse" : "0");
    let partial: string;
    if (item.slug === "mse-loss")
      partial = canonical.replace(
        "return tf.losses.sigmoidCrossEntropy(labels, logits);",
        "return tf.scalar(0);",
      );
    else if (item.slug === "gradient-step")
      partial = canonical.replace(
        /if\s*\(gradient\)\s*gradient\.dispose\(\);/,
        "// Previous gradient intentionally leaked.",
      );
    else
      partial = canonical.replace(
        "function diagnose(trainLosses, valLosses) {",
        "function diagnose(trainLosses, valLosses) { throw new Error('diagnostic probe');",
      );
    expect(partial).not.toBe(canonical);
    await replaceCode(page, partial);
    await expect(viewer).toContainText("The editor has changed.");
    await runCode(page, false);
    if (item.slug === "gradient-step") {
      await expect(viewer).toHaveCount(0);
      await expect(
        page.getByRole("region", {
          name: "Your first weight update: result data",
          exact: true,
        }),
      ).toBeVisible();
    } else {
      await expect(viewer).toContainText("Some checks still need attention.");
      if (item.slug === "mse-loss") {
        await viewer
          .getByRole("combobox", { name: "Loss probe", exact: true })
          .selectOption("bce");
        await viewer
          .getByRole("combobox", { name: "Confidence case", exact: true })
          .selectOption("1");
        await expect(value("Your returned batch cross-entropy")).toHaveText(
          "0",
        );
        await expect(value("JavaScript batch reference")).toHaveText(
          "3.048587",
        );
      } else {
        await expect(value("Diagnosis status")).toHaveText("threw");
        await expect(value("Your returned diagnosis")).toHaveText(
          "No valid label returned",
        );
        await expect(viewer).toContainText("diagnostic probe");
      }
      await checkBrowser();
      await viewer.screenshot({
        path: testInfo.outputPath(`${item.slug}-partial.png`),
        caret: "initial",
      });
      await replaceCode(page, `${partial}\n// Edit after capture.\n`);
      await expect(viewer).toContainText("The editor has changed.");
    }
    expect(errors).toEqual([]);
    writeFileSync(
      testInfo.outputPath("training-result-evidence.json"),
      JSON.stringify(
        {
          ...evidence,
          actualBrowserWorker: true,
          fictionalLocalAccount: "Alex",
          rerunReset: true,
          completionSaved: true,
          usefulFailure: true,
          pageErrors: errors,
        },
        null,
        2,
      ),
    );
  });
}
