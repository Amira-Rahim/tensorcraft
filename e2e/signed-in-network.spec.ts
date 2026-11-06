import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { contrastRatio } from "../packages/worlds/src/wcag";
import type { LearningEvidenceSnapshot } from "../apps/web/lib/learning-evidence-types";
import {
  assertLocalReviewReady,
  completeAlexModule,
  loginReviewAccount,
  resetAlexLesson,
  REVIEW_ACCOUNTS,
} from "./helpers/local-review";

const lessonPath = "/worlds/deep-orbit/neural-networks/building-a-network";

async function expectNoPageOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
}

function cssColorHex(color: string) {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase();
  const values = color.match(/[\d.]+/g)?.map(Number);
  expect(values?.length).toBeGreaterThanOrEqual(3);
  return `#${values!
    .slice(0, 3)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

async function savedNetworkRuns(page: Page) {
  return page.evaluate(async (owner) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("tc-learning-evidence", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error("Saved history could not open."));
    });
    try {
      return await new Promise<LearningEvidenceSnapshot[]>(
        (resolve, reject) => {
          const request = database
            .transaction("owners", "readonly")
            .objectStore("owners")
            .get(owner);
          request.onsuccess = () => {
            const milestones = request.result?.milestones ?? {};
            resolve(
              Object.values(milestones).flatMap((value) => {
                const pair = value as {
                  first: LearningEvidenceSnapshot | null;
                  latest: LearningEvidenceSnapshot | null;
                };
                return [pair.first, pair.latest].filter(
                  (run): run is LearningEvidenceSnapshot =>
                    run?.exerciseSlug === "simple-network",
                );
              }),
            );
          };
          request.onerror = () =>
            reject(new Error("Saved history could not read."));
        },
      );
    } finally {
      database.close();
    }
  }, `account:${REVIEW_ACCOUNTS.alex.id}`);
}

test.beforeAll(assertLocalReviewReady);

const reviewCases = [1440, 1024, 390, 320].flatMap((width) =>
  (["dark", "light"] as const).map((scheme) => ({ width, scheme })),
);

for (const { width, scheme } of reviewCases) {
  test(`signed-in network preserves the complete mission at ${width}px in ${scheme}`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(300_000);
    await completeAlexModule("foundations");
    await resetAlexLesson("building-a-network");
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.setItem("tc-cookie-consent", "declined");
      localStorage.setItem("tc-script-skip", "1");
    });
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
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

    await test.step("briefing opens on Mirza's mission and its visible scene", async () => {
      await expect(page.locator(".lesson-page")).toHaveAttribute(
        "data-step",
        "Briefing",
      );
      await expect(
        page.getByRole("heading", {
          name: "Building a Complete Network",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByText(
          "Assemble it. I want the classifier compiled and ready for training by end of watch.",
          { exact: true },
        ),
      ).toBeVisible();
      await expect(
        page.getByRole("img", {
          name: /complete three-stage network schematic rotates/,
        }),
      ).toBeVisible();
      await expect(page.getByTestId("epilogue")).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Step 5: Epilogue", exact: true }),
      ).toBeDisabled();
      await expectNoPageOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath(`network-briefing-${width}.png`),
        fullPage: true,
      });
      await page
        .getByTestId("lesson-nav")
        .getByRole("button", { name: "Continue", exact: true })
        .click();
    });

    await test.step("concept checks shapes without claiming to train a model", async () => {
      const investigation = page.getByTestId("lesson-investigation");
      await expect(investigation).toBeVisible();
      await expect(
        page.getByRole("complementary", {
          name: "Mission context",
          exact: true,
        }),
      ).toBeVisible();
      await expect(investigation).toContainText(
        "The diagram does not construct or train a model.",
      );
      const prediction = investigation.getByRole("textbox", {
        name: "How many weights does the output layer need, excluding its biases?",
        exact: true,
      });
      await prediction.fill("5");
      await prediction.press("Enter");
      await expect(
        investigation.getByRole("status", { name: "Experiment status" }),
      ).toContainText("Incorrect prediction.");
      await expect(prediction).toHaveAttribute("aria-invalid", "true");
      await prediction.fill("4");
      await expect(prediction).not.toHaveAttribute("aria-invalid", "true");
      await investigation
        .getByRole("button", { name: "Run experiment", exact: true })
        .click();
      await expect(
        investigation.getByRole("status", { name: "Experiment status" }),
      ).toContainText("Correct prediction.");
      await investigation
        .getByRole("combobox", { name: "Output units", exact: true })
        .selectOption("2");
      await expect(
        investigation.getByRole("status", { name: "Experiment status" }),
      ).toContainText("Inputs changed. Run again to update the result.");
      await prediction.fill("8");
      await investigation
        .getByRole("button", { name: "Run experiment", exact: true })
        .click();
      await expect(
        investigation.getByRole("status", { name: "Experiment status" }),
      ).toContainText("Correct prediction.");
      await investigation
        .getByRole("button", { name: "Compare with previous run", exact: true })
        .click();
      await expect(
        investigation.getByRole("region", {
          name: "Previous run",
          exact: true,
        }),
      ).toContainText("[4, 1]");
      await expect(
        investigation.getByRole("region", { name: "Latest run", exact: true }),
      ).toContainText("[4, 2]");
      await expectNoPageOverflow(page);
      await investigation.screenshot({
        path: testInfo.outputPath(`network-concept-${width}.png`),
      });
      await page
        .getByTestId("lesson-nav")
        .getByRole("button", { name: "Continue", exact: true })
        .click();
    });

    await test.step("real training produces inspectable scores with explicit source limits", async () => {
      await expect(page.locator(".cm-content").first()).toBeVisible();
      await expect(
        page.getByRole("complementary", {
          name: "Mission context",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", {
          name: "Pass 1 more exercise to continue",
          exact: true,
        }),
      ).toBeDisabled();
      await page
        .getByRole("button", { name: "Run Tests", exact: true })
        .click();
      await expect(page.getByTestId("test-results-panel")).toBeVisible({
        timeout: 60_000,
      });
      await expect(page.getByTestId("test-results-panel")).not.toContainText(
        "All tests passed!",
      );
      await expect(page.getByTestId("challenge-passed-banner")).toHaveCount(0);
      await page
        .getByRole("button", { name: "Show Solution", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Run Tests", exact: true })
        .click();
      await expect(page.getByTestId("test-results-panel")).toContainText(
        "All tests passed!",
        { timeout: 90_000 },
      );
      const githubNotice = page.getByTestId("github-nudge-toast");
      await expect(githubNotice).toBeVisible();
      await githubNotice
        .getByRole("button", { name: "Dismiss", exact: true })
        .click();
      await expect(githubNotice).toHaveCount(0);
      const current = page.getByRole("region", {
        name: "Result from this run",
        exact: true,
      });
      await expect(
        current.getByRole("heading", {
          name: "Your model before and after training",
          exact: true,
        }),
      ).toBeVisible();
      await expect(current).toContainText(
        "These predictions reuse training rows. They do not measure performance on new data.",
      );
      await expect(current).toContainText(
        "separate from the normalization exercise",
      );
      const selector = current.getByRole("combobox", {
        name: "Training row",
        exact: true,
      });
      await expect(selector.locator("option")).toHaveCount(16);
      await selector.selectOption("8");
      await expect(current).toContainText("Row 60 has label 1 (flagged).");
      await current.getByText("Selected input values", { exact: true }).click();
      await expect(current).toContainText(
        "These generated practice values have no physical units.",
      );
      const settings = current.getByRole("region", {
        name: "Captured training settings",
        exact: true,
      });
      await expect(settings).toContainText("529");
      await expect(settings).toContainText("Rows passed to fit");
      await expect(settings).toContainText("120");
      const chartColors = await current
        .getByRole("region", { name: "Captured training loss", exact: true })
        .locator("[data-exercise-series]")
        .evaluate((series) => {
          let background: Element | null = series;
          while (background) {
            const value = getComputedStyle(background).backgroundColor;
            if (value !== "rgba(0, 0, 0, 0)" && value !== "transparent") {
              return {
                stroke: getComputedStyle(series).stroke,
                fill: getComputedStyle(series).fill,
                surface: value,
                primary: getComputedStyle(series)
                  .getPropertyValue("--tc-primary")
                  .trim(),
              };
            }
            background = background.parentElement;
          }
          throw new Error("The training chart has no opaque surface.");
        });
      expect(cssColorHex(chartColors.stroke)).toBe(
        cssColorHex(chartColors.primary),
      );
      expect(chartColors.fill).toBe(chartColors.stroke);
      expect(
        contrastRatio(
          cssColorHex(chartColors.stroke),
          cssColorHex(chartColors.surface),
        ),
      ).toBeGreaterThanOrEqual(3);
      await expect(
        current
          .getByRole("button", { name: "Loss", exact: true })
          .locator("span"),
      ).toHaveCSS("color", chartColors.stroke);
      const history = page.getByRole("region", {
        name: "Saved network runs",
        exact: true,
      });
      await history
        .getByRole("button", { name: "Save this run", exact: true })
        .click();
      await expect(
        history.getByRole("button", { name: "Run saved", exact: true }),
      ).toBeVisible();
      await history
        .locator("summary")
        .filter({ hasText: "Saved run:" })
        .click();
      await expect(history).toContainText("Solution viewed before this run.");
      await history
        .getByRole("button", { name: "Inspect this run above", exact: true })
        .click();
      await expect(current).toBeFocused();
      await expect(history.getByRole("combobox")).toHaveCount(0);
      const [record] = await savedNetworkRuns(page);
      expect(record.ownerScope).toBe(`account:${REVIEW_ACCOUNTS.alex.id}`);
      expect(record.runtimeVersion).toBe("4.22.0");
      expect(record.backend).toBe("cpu");
      expect(record.artifacts).toHaveLength(4);
      expect(record.selectedRowIds).toEqual([
        0, 1, 2, 3, 4, 5, 6, 7, 60, 61, 62, 63, 64, 65, 66, 67,
      ]);
      expect(record.assistance.solutionViewed).toBe(true);
      expect(record).not.toHaveProperty("testCode");
      const downloadReady = page.waitForEvent("download");
      await history
        .getByRole("button", { name: "Download this run", exact: true })
        .click();
      const download = await downloadReady;
      expect(download.suggestedFilename()).toBe(
        `tensorcraft-network-${record.runId}.json`,
      );
      const downloadedPath = await download.path();
      expect(downloadedPath).not.toBeNull();
      expect(JSON.parse(await readFile(downloadedPath!, "utf8"))).toEqual(
        record,
      );
      const loss = record.artifacts.find(
        (artifact) => artifact.kind === "series",
      );
      expect(loss?.kind === "series" && loss.labels.length).toBe(50);
      const scores = record.artifacts.find(
        (artifact) =>
          artifact.title === "Scores from your before-and-after run",
      );
      expect(scores?.kind).toBe("table");
      if (scores?.kind === "table") {
        for (const score of scores.rows[8].slice(2)) {
          await expect(current).toContainText(
            Number(score).toLocaleString(undefined, {
              maximumSignificantDigits: 6,
            }),
          );
        }
        const untrainedBar = await current
          .getByText("Second model, kept untrained", { exact: true })
          .locator("..")
          .locator("dd[aria-hidden] > div")
          .evaluate((bar) => {
            const track = bar.parentElement!;
            return {
              fill: getComputedStyle(bar).backgroundColor,
              track: getComputedStyle(track).backgroundColor,
              fraction:
                bar.getBoundingClientRect().width /
                track.getBoundingClientRect().width,
            };
          });
        expect(untrainedBar.fill).toMatch(/^rgb\(/);
        expect(
          contrastRatio(
            cssColorHex(untrainedBar.fill),
            cssColorHex(untrainedBar.track),
          ),
        ).toBeGreaterThanOrEqual(3);
        expect(untrainedBar.fraction).toBeCloseTo(Number(scores.rows[8][3]), 2);
      }
      expect(
        (
          await new AxeBuilder({ page })
            .include(`[id="${await current.getAttribute("id")}"]`)
            .withTags(["wcag2a", "wcag2aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await expectNoPageOverflow(page);
      await current.screenshot({
        path: testInfo.outputPath(`network-current-result-${width}.png`),
      });
    });

    await test.step("failed retry keeps the useful run and restoration preserves the newer draft", async () => {
      const history = page.getByRole("region", {
        name: "Saved network runs",
        exact: true,
      });
      const editor = page.locator(".cm-content").first();
      const newerCode = "throw new Error('Local review network retry');";
      await editor.click();
      await page.keyboard.press(
        process.platform === "darwin" ? "Meta+a" : "Control+a",
      );
      await page.keyboard.insertText(newerCode);
      await expect(
        page.getByRole("region", { name: "Result from this run", exact: true }),
      ).toContainText(/code.*changed|different code/i);
      await page
        .getByRole("button", { name: "Restore My Code", exact: true })
        .click();
      await editor.click();
      await page.keyboard.press(
        process.platform === "darwin" ? "Meta+a" : "Control+a",
      );
      await page.keyboard.insertText(newerCode);
      await page
        .getByRole("button", { name: "Run Tests", exact: true })
        .click();
      await expect(page.getByTestId("test-results-panel")).toContainText(
        "Local review network retry",
      );
      await expect(page.getByTestId("challenge-passed-banner")).toHaveAttribute(
        "data-completion-state",
        "earlier",
      );
      const previous = page
        .locator("details")
        .filter({
          has: page.locator("summary").filter({ hasText: /^Previous run$/ }),
        })
        .first();
      await expect(previous).not.toHaveAttribute("open", "");
      await history
        .getByRole("button", { name: "Save this run", exact: true })
        .click();
      await expect(
        history.locator("summary").filter({ hasText: "Latest saved run:" }),
      ).toBeVisible();
      expect(
        (await savedNetworkRuns(page)).map((record) => record.runOutcome),
      ).toEqual(["passed", "errored"]);
      await history
        .getByRole("button", { name: "Restore saved code", exact: true })
        .first()
        .click();
      await expect(editor).not.toContainText(newerCode);
      await page.reload();
      await expect(editor).toBeVisible();
      await expect(
        page.getByRole("region", { name: "Result from this run", exact: true }),
      ).toHaveCount(0);
      await page
        .getByRole("button", { name: "Restore My Code", exact: true })
        .click();
      await expect(editor).toContainText(newerCode);
      await history
        .locator("summary")
        .filter({ hasText: "Earlier saved run:" })
        .click();
      await expect(
        history.getByRole("combobox", { name: "Training row", exact: true }),
      ).toBeVisible();
      await history
        .getByRole("combobox", { name: "Training row", exact: true })
        .selectOption("15");
      await expect(history).toContainText("Row 67 has label 1 (flagged).");
      await expect(
        history
          .getByText(
            "Saved in this browser. Supplied 120-row synthetic training rehearsal",
            { exact: true },
          )
          .first(),
      ).toHaveCSS("font-size", "14px");
      await expect(
        history
          .getByText(
            "This exercise supplies a synthetic rehearsal with eight features. It is separate from the normalization exercise and the ship’s three-feature model. These predictions reuse training rows. They do not measure performance on new data.",
            { exact: true },
          )
          .first(),
      ).toHaveCSS("font-size", "16px");
      await expectNoPageOverflow(page);
      await history.screenshot({
        path: testInfo.outputPath(`network-restored-history-${width}.png`),
      });
      await history
        .getByRole("button", { name: "Restore saved code", exact: true })
        .first()
        .click();
      await page
        .getByRole("button", { name: "Run Tests", exact: true })
        .click();
      await expect(page.getByTestId("test-results-panel")).toContainText(
        "All tests passed!",
        { timeout: 90_000 },
      );
      await page
        .getByTestId("challenge-passed-banner")
        .getByRole("button", { name: "Continue", exact: true })
        .click();
    });

    await test.step("recall explains errors and checks shapes and parameters before its recap", async () => {
      const cards = page.getByRole("form", {
        name: "Knowledge check",
        exact: true,
      });
      await expect(cards).toHaveCount(2);
      await expect(page.getByTestId("takeaways-prose")).toHaveCount(0);
      await cards
        .nth(0)
        .getByRole("radio", {
          name: "The learned weights from the training examples.",
          exact: true,
        })
        .check();
      await cards
        .nth(0)
        .getByRole("radio", { name: "Yes.", exact: true })
        .check();
      await cards
        .nth(0)
        .getByRole("button", { name: "Check answers", exact: true })
        .click();
      await expect(cards.nth(0).getByRole("status")).toContainText(
        "0 of 2 correct",
      );
      const correct = cards.nth(0).getByRole("radio", {
        name: "The optimizer, loss function and metrics for training.",
        exact: true,
      });
      await correct.focus();
      await correct.press("Space");
      await cards
        .nth(0)
        .getByRole("radio", { name: "No.", exact: true })
        .check();
      await cards
        .nth(0)
        .getByRole("button", { name: "Check again", exact: true })
        .click();
      await expect(cards.nth(0).getByRole("status")).toContainText(
        "All answers are correct",
      );
      await cards
        .nth(1)
        .getByRole("textbox", {
          name: "A batch has shape [rows, 3] and the dense layer has 32 units. What is the kernel shape?",
          exact: true,
        })
        .fill("[3, 32]");
      await cards
        .nth(1)
        .getByRole("textbox", {
          name: "Including one bias per unit, how many parameters does that layer have?",
          exact: true,
        })
        .fill("128");
      await cards
        .nth(1)
        .getByRole("button", { name: "Check answers", exact: true })
        .click();
      await expect(cards.nth(1).getByRole("status")).toContainText(
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
      await expectNoPageOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath(`network-takeaways-${width}.png`),
        fullPage: true,
      });
      await page
        .getByTestId("lesson-nav")
        .getByRole("button", { name: "Continue", exact: true })
        .click();
    });

    await test.step("earned ending archives initial states without inventing a verdict", async () => {
      await expect(page.getByTestId("epilogue")).toBeVisible();
      await expect(
        page.getByRole("complementary", { name: "Closing scene", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("img", {
          name: /complete three-stage network schematic rotates/,
        }),
      ).toBeVisible();
      await expect(
        page.getByText(/Sample 7741 changes position in the sorted results/),
      ).toBeVisible();
      await expect(
        page.getByText(
          "Keep the reading flagged. We can’t trust these scores until we’ve trained and tested the model.",
          { exact: true },
        ),
      ).toBeVisible();
      await expect(
        page.getByText(
          "Initial states archived. I can reproduce my own mistakes. I will require the same of this system.",
          { exact: true },
        ),
      ).toBeVisible();
      await expectNoPageOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath(`network-epilogue-${width}.png`),
        fullPage: true,
      });
    });
    expect(pageErrors).toEqual([]);
  });
}
