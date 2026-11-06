import { test, expect, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { decodeEvaluationResult } from "../packages/shared/src/evaluation-result.mjs";
import type { LearningEvidenceSnapshot } from "../apps/web/lib/learning-evidence-types";
import {
  assertLocalReviewReady,
  loginReviewAccount,
  resetAlexLesson,
  completeAlexModule,
  REVIEW_ACCOUNTS,
} from "./helpers/local-review";

const lessonPath = "/worlds/deep-orbit/training-loop/evaluating-deep-scan";
const writing = process.env.TENSORCRAFT_REVIEW_EVALUATION_SAVES === "true";

async function signOut(page: Page) {
  const mobileMenu = page.getByRole("button", {
    name: "Open menu",
    exact: true,
  });
  if (await mobileMenu.isVisible()) {
    await mobileMenu.click();
    await page
      .getByRole("dialog", { name: "Site menu" })
      .getByRole("link", { name: "Settings", exact: true })
      .click();
    await page.getByRole("tab", { name: /^account$/i }).click();
    await page.getByTestId("sign-out").click();
  } else {
    await page.getByRole("button", { name: "User menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
  }
  await expect(page).toHaveURL("http://localhost:3100/");
}

async function readableCategories(chart: Locator) {
  await expect(chart.locator(".orbit-investigation-bar-label")).toHaveText([
    "True positive",
    "False positive",
    "False negative",
    "True negative",
  ]);
  expect(
    await chart.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return Array.from(
        element.querySelectorAll(".orbit-investigation-bar-row"),
      ).every((row) => {
        const label = row.querySelector(".orbit-investigation-bar-label")!;
        const value = row.querySelector(".orbit-investigation-bar-value")!;
        const a = label.getBoundingClientRect();
        const b = value.getBoundingClientRect();
        const overlaps =
          Math.min(a.right, b.right) > Math.max(a.left, b.left) &&
          Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
        return (
          !overlaps &&
          a.left >= bounds.left - 1 &&
          a.right <= bounds.right + 1 &&
          getComputedStyle(label).fontSize === "16px"
        );
      });
    }),
  ).toBe(true);
}

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
}
async function replaceCode(page: Page, code: string) {
  await page.locator(".cm-content").first().click();
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+a" : "Control+a",
  );
  await page.keyboard.insertText(code);
}
async function savedEvaluation(
  page: Page,
): Promise<LearningEvidenceSnapshot | null> {
  return page.evaluate(
    (ownerScope) =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("tc-learning-evidence", 1);
        request.onerror = () =>
          reject(new Error("Local browser history unavailable"));
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("owners", "readonly");
          const row = tx.objectStore("owners").get(ownerScope);
          row.onerror = () => {
            db.close();
            reject(new Error("Local history read failed"));
          };
          row.onsuccess = () => {
            db.close();
            resolve(
              row.result?.milestones?.["held-out-evaluation"]?.first ?? null,
            );
          };
        };
      }),
    `account:${REVIEW_ACCOUNTS.alex.id}`,
  );
}

test.beforeAll(async () => {
  await assertLocalReviewReady();
});

test("paid learner sees the evaluation prerequisite gate before fixture completion @prerequisite", async ({
  page,
}) => {
  await resetAlexLesson("building-a-network");
  await loginReviewAccount(page, "alex");
  await page.goto(lessonPath);
  await expect(
    page.getByRole("heading", {
      name: "Complete the previous module first",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Go to previous module" }),
  ).toHaveAttribute("href", "/worlds/deep-orbit/neural-networks");
  await expect(page.locator(".cm-content")).toHaveCount(0);
});

const reviewCases = [1440, 1024, 390, 320].flatMap((width) =>
  (["dark", "light"] as const).map((scheme) => ({ width, scheme })),
);

for (const { width, scheme } of reviewCases) {
  test(`signed-in evaluation complete mission at ${width}px in ${scheme} (${writing ? "writer" : "reader"}) @mission`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(300000);
    await completeAlexModule("neural-networks");
    await resetAlexLesson("evaluating-deep-scan");
    await page.setViewportSize({ width, height: 950 });
    await page.emulateMedia({
      colorScheme: scheme,
      reducedMotion: "reduce",
    });
    await page.addInitScript(() => {
      localStorage.setItem("tc-cookie-consent", "declined");
      localStorage.setItem("tc-script-skip", "1");
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await loginReviewAccount(page, "alex", lessonPath);
    if (scheme === "light") {
      await expect(page.locator("html")).toHaveAttribute(
        "data-scheme",
        "light",
      );
    } else {
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-scheme",
        "light",
      );
    }
    await expect(page.locator(".lesson-page")).toHaveAttribute(
      "data-step",
      "Briefing",
    );
    await expect(
      page.getByRole("img", { name: /Mirza stands alone at the command tier/ }),
    ).toBeVisible();
    await expect(page.locator("[data-dialogue]")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Step 5: Epilogue" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("img", {
        name: "Scores with reviewed labels",
        exact: true,
      }),
    ).toHaveAttribute("data-domain-high", "0.91");
    const briefingCounts = page.getByRole("img", {
      name: "Correct predictions, false alarms and misses",
      exact: true,
    });
    await expect(briefingCounts).toHaveAttribute("data-domain-high", "5");
    await readableCategories(briefingCounts);
    await page.screenshot({
      path: testInfo.outputPath(`evaluation-briefing-${width}.png`),
      fullPage: true,
    });
    await page
      .getByTestId("lesson-nav")
      .getByRole("button", { name: "Continue", exact: true })
      .click();

    const investigation = page.getByTestId("lesson-investigation");
    await expect(investigation).toContainText(
      "Twelve labeled teaching cases, separate from the graded exercise",
    );
    const threshold = investigation.getByRole("slider", {
      name: "Anomaly score threshold",
    });
    await expect(threshold).toHaveValue("0.5");
    await threshold.focus();
    await threshold.press("ArrowRight");
    await expect(threshold).toHaveValue("0.55");
    const prediction = investigation.getByRole("textbox", {
      name: "How many labeled anomalies will this threshold miss?",
    });
    await prediction.fill("0");
    await investigation
      .getByRole("button", { name: "Run experiment", exact: true })
      .click();
    await expect(
      investigation.getByRole("status", { name: "Experiment status" }),
    ).toContainText("Incorrect prediction.");
    await prediction.fill("1");
    await investigation
      .getByRole("button", { name: "Run experiment", exact: true })
      .click();
    await expect(
      investigation.getByRole("status", { name: "Experiment status" }),
    ).toContainText("Correct prediction.");
    await expect(investigation).toContainText(
      "the rule misses 1 anomalies and flags 2 normal cases",
    );
    await investigation
      .getByRole("combobox", { name: "Choose an example" })
      .selectOption("changed");
    await expect(
      investigation.getByRole("status", { name: "Experiment status" }),
    ).toContainText("Inputs changed.");
    await prediction.fill("3");
    await investigation
      .getByRole("button", { name: "Run experiment", exact: true })
      .click();
    await expect(
      investigation.getByRole("status", { name: "Experiment status" }),
    ).toContainText("Correct prediction.");
    await investigation
      .getByRole("button", { name: "Compare with previous run" })
      .click();
    await expect(
      investigation.getByRole("region", { name: "Previous run", exact: true }),
    ).toContainText("Original labeled scores");
    await expect(
      investigation.getByRole("region", { name: "Latest run", exact: true }),
    ).toContainText("Harder labeled scores");
    await expect(
      investigation.getByRole("img", {
        name: "Scores with reviewed labels",
        exact: true,
      }),
    ).toHaveAttribute("data-domain-high", "0.91");
    for (const runName of ["Previous run", "Latest run"]) {
      const counts = investigation
        .getByRole("region", { name: runName, exact: true })
        .getByRole("img", {
          name: "Correct predictions, false alarms and misses",
          exact: true,
        });
      await expect(counts).toHaveAttribute("data-domain-high", "5");
      await readableCategories(counts);
    }
    await expect(
      page.getByRole("complementary", { name: "Mission context", exact: true }),
    ).toBeVisible();
    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-testid="lesson-investigation"]')
          .withTags(["wcag2a", "wcag2aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await noOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`evaluation-concept-${width}.png`),
      fullPage: true,
    });
    await page
      .getByTestId("lesson-nav")
      .getByRole("button", { name: "Continue", exact: true })
      .click();

    await expect(page.locator(".cm-content")).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Pass 1 more exercise to continue",
        exact: true,
      }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Run Tests", exact: true }).click();
    await expect(page.getByTestId("test-results-panel")).toBeVisible({
      timeout: 60000,
    });
    await expect(page.getByTestId("test-results-panel")).not.toContainText(
      "All tests passed!",
    );
    await expect(page.getByTestId("challenge-passed-banner")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Show Solution", exact: true })
      .click();
    await page.getByRole("button", { name: "Run Tests", exact: true }).click();
    await expect(page.getByTestId("test-results-panel")).toContainText(
      "All tests passed!",
      { timeout: 60000 },
    );
    const githubNotice = page.getByTestId("github-nudge-toast");
    await expect(githubNotice).toBeVisible();
    await githubNotice.getByRole("button", { name: "Dismiss" }).click();
    await expect(githubNotice).toHaveCount(0);
    const current = page.getByRole("region", {
      name: "Result from this run",
      exact: true,
    });
    await expect(current.locator("[data-case-id]")).toHaveCount(43);
    await current
      .getByRole("combobox", { name: "Case to inspect" })
      .selectOption("40");
    await expect(
      current.getByRole("heading", { name: "Case 40", exact: true }),
    ).toBeVisible();
    await expect(current).toContainText(
      "The crew’s fictional 94% result remains separate from this run.",
    );
    await expect(current.getByRole("slider")).toHaveCount(0);
    await current
      .getByRole("button", { name: "Missed anomalies", exact: true })
      .click();
    await expect(current.locator("[data-case-id]")).toHaveCount(43);
    await current
      .getByRole("button", { name: "All cases", exact: true })
      .click();
    const history = page.getByRole("region", {
      name: "Saved evaluation runs",
      exact: true,
    });
    const downloadPromise = page.waitForEvent("download");
    await history
      .getByRole("button", { name: "Download this run", exact: true })
      .click();
    const download = await downloadPromise;
    const capture = JSON.parse(
      await readFile((await download.path())!, "utf8"),
    ) as LearningEvidenceSnapshot;
    expect(capture.ownerScope).toBe(`account:${REVIEW_ACCOUNTS.alex.id}`);
    expect(capture.exerciseSlug).toBe("deep-scan-eval");
    expect(capture.assistance.solutionViewed).toBe(true);
    expect(capture).not.toHaveProperty("testCode");
    expect(decodeEvaluationResult(capture.artifacts).cases).toHaveLength(43);

    if (writing) {
      await history
        .getByRole("button", { name: "Save this run", exact: true })
        .click();
      await expect(
        history.getByRole("button", { name: "Run saved", exact: true }),
      ).toBeVisible();
      expect(await savedEvaluation(page)).toEqual(capture);
      await history
        .locator("summary")
        .filter({ hasText: /^Saved run:/ })
        .click();
      await history
        .getByRole("button", { name: "Inspect this run above" })
        .click();
      await expect(current).toBeFocused();
      await expect(page.locator("[data-case-id]")).toHaveCount(43);
    } else {
      await expect(
        history.getByRole("button", { name: "Save this run", exact: true }),
      ).toBeDisabled();
      await expect(history).toContainText(
        "Saving evaluation runs is not available in this release.",
      );
      expect(await savedEvaluation(page)).toBeNull();
    }
    await noOverflow(page);
    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-testid="exercise-pane"]')
          .withTags(["wcag2a", "wcag2aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await current.screenshot({
      path: testInfo.outputPath(`evaluation-current-${width}.png`),
    });

    if (writing) {
      await page
        .getByRole("button", { name: "Restore My Code", exact: true })
        .click();
      const newer = "throw new Error('Evaluation review newer draft');";
      await replaceCode(page, newer);
      await page
        .getByRole("button", { name: "Run Tests", exact: true })
        .click();
      await expect(page.getByTestId("test-results-panel")).toContainText(
        "Evaluation review newer draft",
      );
      await expect(page.getByTestId("challenge-passed-banner")).toHaveAttribute(
        "data-completion-state",
        "earlier",
      );
      await history
        .getByRole("button", { name: "Inspect this run above" })
        .click();
      await expect(
        page
          .locator("details[open]")
          .filter({ has: page.getByText("Previous run", { exact: true }) }),
      ).toContainText("Case 0");
      await history
        .getByRole("button", { name: "Restore saved code", exact: true })
        .click();
      await expect(page.locator(".cm-content")).toContainText(
        "tf.sequential()",
      );
      await page.reload();
      await expect(page.locator(".cm-content")).toContainText(
        "tf.sequential()",
      );
      await history
        .locator("summary")
        .filter({ hasText: /^Saved run:/ })
        .click();
      await expect(history.locator("[data-case-id]")).toHaveCount(43);
      expect(await savedEvaluation(page)).toEqual(capture);
      await history.screenshot({
        path: testInfo.outputPath(`evaluation-saved-${width}.png`),
      });
      await page
        .getByRole("button", { name: "Restore My Code", exact: true })
        .click();
      await expect(page.locator(".cm-content")).toContainText(newer);
    }

    const decision = page.getByRole("region", {
      name: "Decision: choose a review policy",
      exact: true,
    });
    await decision
      .getByRole("radio", { name: "Use the model", exact: true })
      .check();
    await decision
      .getByRole("spinbutton", {
        name: "Total error cost of your chosen policy (minutes)",
      })
      .fill("28");
    await decision
      .getByRole("textbox", { name: "Your reasoning", exact: true })
      .fill(
        "Two missed failures cost 16 minutes and 12 unnecessary reviews cost 12. Validate the cost assumptions and evaluate the chosen policy on the final period.",
      );
    await decision
      .getByRole("textbox", { name: "Help used, or None" })
      .fill("None");
    await decision
      .getByRole("spinbutton", { name: "Minutes spent (your estimate)" })
      .fill("3");
    await decision
      .getByRole("button", { name: "Submit decision and show feedback" })
      .click();
    await expect(decision).toContainText(
      "Your choice and calculation are correct!",
    );
    const assignment = page.getByRole("region", {
      name: "Independent assignment: build failure triage",
      exact: true,
    });
    await expect(assignment).toContainText(
      "It does not award XP or gate the next lesson.",
    );
    const assignmentDownload = page.waitForEvent("download");
    await assignment
      .getByRole("link", { name: "Download assignment", exact: true })
      .click();
    const zip = await assignmentDownload;
    expect(zip.suggestedFilename()).toBe("build-triage-v1.zip");
    expect(
      (await readFile((await zip.path())!)).subarray(0, 2).toString(),
    ).toBe("PK");
    const reportField = assignment.getByRole("textbox", {
      name: "Decision and error costs",
      exact: true,
    });
    const reportNote =
      "Review draft: compare missed failures with unnecessary reviews. No independent experiment has been run.";
    await reportField.fill(reportNote);
    const reportDownloadPromise = page.waitForEvent("download");
    await assignment
      .getByRole("button", { name: "Download report", exact: true })
      .click();
    const reportDownload = await reportDownloadPromise;
    const reportPath = (await reportDownload.path())!;
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    expect(report.answers.decision).toBe(reportNote);
    expect(report.selfReviewedAt).toBeNull();
    await assignment
      .getByRole("button", { name: "I need help with the split" })
      .click();
    await reportField.fill("A newer local draft for the import check.");
    await assignment
      .getByLabel("Load a saved report (replaces current answers)")
      .setInputFiles(reportPath);
    await expect(reportField).toHaveValue(reportNote);
    await expect(assignment).toContainText(
      "Report loaded. Review the answers again",
    );
    await page.reload();
    await expect(reportField).toHaveValue(reportNote);
    await expect(
      assignment.getByRole("button", { name: "I need help with the split" }),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(
      assignment.getByRole("button", {
        name: "Mark self-reviewed",
        exact: true,
      }),
    ).toBeDisabled();

    await page
      .getByTestId("challenge-passed-banner")
      .getByRole("button", { name: "Continue", exact: true })
      .click();
    const reflection = page.getByRole("textbox", {
      name: "Explain what you would investigate before treating a 95% training versus 60% test accuracy gap as overfitting.",
    });
    await reflection.fill(
      "Check data shift, labels, and preprocessing before diagnosing the gap.",
    );
    await page
      .getByRole("button", { name: "Show answer", exact: true })
      .click();
    await page.getByRole("button", { name: "Got it", exact: true }).click();
    const recall = page.getByRole("form", {
      name: "Knowledge check",
      exact: true,
    });
    await expect(recall).toHaveCount(2);
    await recall
      .nth(0)
      .getByRole("radio", {
        name: "Assign earlier rows to training and later rows to validation before shuffling training rows.",
        exact: true,
      })
      .check();
    await recall
      .nth(0)
      .getByRole("radio", {
        name: "The same row can enter both splits.",
        exact: true,
      })
      .check();
    await recall
      .nth(0)
      .getByRole("button", { name: "Check answers", exact: true })
      .click();
    await expect(recall.nth(0).getByRole("status")).toContainText(
      "All answers are correct",
    );
    await recall
      .nth(1)
      .getByRole("radio", {
        name: "When the alert threshold and the kinds of examples within each class stay the same.",
        exact: true,
      })
      .check();
    await recall
      .nth(1)
      .getByRole("button", { name: "Check answer", exact: true })
      .click();
    await expect(recall.nth(1).getByRole("status")).toContainText(
      "All answers are correct",
    );
    await expect(page.getByTestId("takeaways-prose")).toBeVisible();
    expect(
      (
        await new AxeBuilder({ page })
          .include(".review-check")
          .withTags(["wcag2a", "wcag2aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await noOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`evaluation-takeaways-${width}.png`),
      fullPage: true,
    });
    await page
      .getByTestId("lesson-nav")
      .getByRole("button", { name: "Continue", exact: true })
      .click();
    await expect(page.getByTestId("epilogue")).toBeVisible();
    await expect(
      page.getByText(/After Mirza allows the supervised prototype test/),
    ).toBeVisible();
    await expect(page.getByTestId("epilogue")).toContainText("0.518");
    await expect(page.getByTestId("epilogue")).toContainText("7741");
    await expect(page.getByTestId("epilogue")).toContainText("94%");
    await noOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`evaluation-epilogue-${width}.png`),
      fullPage: true,
    });

    if (writing) {
      await page.goto("/dashboard/project");
      await page
        .locator("summary:visible")
        .filter({ hasText: /^Evaluation/ })
        .click();
      const project = page.getByRole("region", {
        name: "Saved evaluation runs",
        exact: true,
      });
      await project
        .locator("summary")
        .filter({ hasText: /^Saved run:/ })
        .click();
      await expect(project.locator("[data-case-id]")).toHaveCount(43);
      expect(await savedEvaluation(page)).toEqual(capture);
      const savedDownloadPromise = page.waitForEvent("download");
      await project
        .getByRole("button", { name: "Download saved run", exact: true })
        .click();
      const savedDownload = await savedDownloadPromise;
      expect(
        JSON.parse(await readFile((await savedDownload.path())!, "utf8")),
      ).toEqual(capture);
      await project.screenshot({
        path: testInfo.outputPath(`evaluation-project-${width}.png`),
      });
      await signOut(page);
      await expect(
        page.getByRole("region", { name: "Saved evaluation runs" }),
      ).toHaveCount(0);
      await loginReviewAccount(page, "jordan", "/dashboard/project");
      await expect(
        page.locator('[aria-label="Saved evaluation runs"]'),
      ).toHaveCount(0);
      expect(await savedEvaluation(page)).toEqual(capture);
      await signOut(page);
      await loginReviewAccount(page, "alex", "/dashboard/project");
      await page
        .locator("summary:visible")
        .filter({ hasText: /^Evaluation/ })
        .click();
      await project
        .locator("summary")
        .filter({ hasText: /^Saved run:/ })
        .click();
      await expect(project.locator("[data-case-id]")).toHaveCount(43);
      expect(await savedEvaluation(page)).toEqual(capture);
      await project
        .getByRole("button", { name: "Delete saved run", exact: true })
        .click();
      await expect(project).toContainText("No saved evaluation runs here yet.");
      expect(await savedEvaluation(page)).toBeNull();
      await page.reload();
      await page
        .locator("summary:visible")
        .filter({ hasText: /^Evaluation/ })
        .click();
      await expect(project).toContainText("No saved evaluation runs here yet.");
    }
    expect(errors).toEqual([]);
  });
}
