import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginReviewAccount, resetAlexLesson } from "./helpers/local-review";

const lessonPath = "/worlds/deep-orbit/foundations/normalization";

async function expectNoPageOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
}

async function replaceCode(page: Page, code: string) {
  const editor = page.locator(".cm-content").first();
  await editor.click();
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+a" : "Control+a",
  );
  await page.keyboard.insertText(code);
  await expect(editor).toContainText(code);
}

const reviewViewports = [1440, 1024, 390, 320].flatMap((width) =>
  (["dark", "light"] as const).map((colorScheme) => ({ width, colorScheme })),
);

for (const { width, colorScheme } of reviewViewports) {
  test(`signed-in normalization preserves the complete mission at ${width}px in ${colorScheme}`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(300_000);
    await resetAlexLesson("normalization");
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme });
    await page.addInitScript(() => {
      localStorage.setItem("tc-cookie-consent", "declined");
      localStorage.setItem("tc-script-skip", "1");
    });
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await loginReviewAccount(page, "alex", lessonPath);

    await test.step("briefing keeps the crew, scene and unresolved archive sample visible", async () => {
      await expect(page.locator(".lesson-page")).toHaveAttribute(
        "data-step",
        "Briefing",
      );
      await expect(
        page.getByRole("heading", { name: "Data Normalization", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText(
          "Before the deep scan runs, normalize every sensor feed. One scale, no exceptions.",
          { exact: true },
        ),
      ).toBeVisible();
      await expect(
        page.getByRole("img", {
          name: /bridge holo table squeezes four mismatched sensor traces/,
        }),
      ).toBeVisible();
      await expect(page.getByTestId("epilogue")).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Step 5: Epilogue", exact: true }),
      ).toBeDisabled();
      await expect(page.getByTestId("boss-beat-loading")).toHaveCount(0);
      const storyChoice = page.getByTestId("boss-beat-option-dominant");
      if (await storyChoice.isVisible()) {
        await storyChoice.click();
      }
      await expect(page.getByTestId("boss-beat-resolved")).toBeVisible();
      await expectNoPageOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath(
          `normalization-briefing-${width}-${colorScheme}.png`,
        ),
        fullPage: true,
      });
      await page
        .getByTestId("lesson-nav")
        .getByRole("button", { name: "Continue", exact: true })
        .click();
    });

    await test.step("concept checks a prediction and preserves both changed-input runs", async () => {
      const investigation = page.getByTestId("lesson-investigation");
      await expect(investigation).toBeVisible();
      await expect(
        page.getByRole("complementary", {
          name: "Mission context",
          exact: true,
        }),
      ).toBeVisible();
      const prediction = investigation.getByRole("textbox", {
        name: "What is the first feature of the new row after the selected scaling rule?",
      });
      await prediction.fill("24");
      await prediction.press("Enter");
      await expect(
        investigation.getByRole("status", { name: "Experiment status" }),
      ).toContainText("Incorrect prediction.");
      await expect(prediction).toHaveAttribute("aria-invalid", "true");
      await prediction.fill("0.4472");
      await expect(prediction).not.toHaveAttribute("aria-invalid", "true");
      await investigation
        .getByRole("button", { name: "Run experiment", exact: true })
        .click();
      await expect(
        investigation.getByRole("status", { name: "Experiment status" }),
      ).toContainText("Correct prediction.");
      await investigation
        .getByRole("combobox", { name: "Scaling rule", exact: true })
        .selectOption("2");
      await expect(
        investigation.getByRole("status", { name: "Experiment status" }),
      ).toContainText("Inputs changed. Run again to update the result.");
      await prediction.fill("0.6667");
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
      ).toContainText("Z-score");
      await expect(
        investigation.getByRole("region", { name: "Latest run", exact: true }),
      ).toContainText("Min-max");
      await expectNoPageOverflow(page);
      await investigation.screenshot({
        path: testInfo.outputPath(
          `normalization-concept-${width}-${colorScheme}.png`,
        ),
      });
      await page
        .getByTestId("lesson-nav")
        .getByRole("button", { name: "Continue", exact: true })
        .click();
    });

    await test.step("challenge gates the ending until real checks pass and shows actual output", async () => {
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
      await expect(page.getByTestId("challenge-passed-banner")).toHaveCount(0);
      await page
        .getByRole("button", { name: "Run Tests", exact: true })
        .click();
      await expect(page.getByTestId("test-results-panel")).toBeVisible({
        timeout: 60_000,
      });
      await expect(page.getByTestId("test-results-panel")).not.toContainText(
        "All tests passed!",
      );
      await expect(
        page.getByRole("button", {
          name: "Pass 1 more exercise to continue",
          exact: true,
        }),
      ).toBeDisabled();
      await page
        .getByRole("button", { name: "Show Solution", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Run Tests", exact: true })
        .click();
      await expect(page.getByTestId("test-results-panel")).toContainText(
        "All tests passed!",
        { timeout: 60_000 },
      );
      const current = page.getByRole("region", {
        name: "Result from this run",
        exact: true,
      });
      await expect(
        current.getByRole("heading", {
          name: "A reading from this run",
          exact: true,
        }),
      ).toBeVisible();
      await current
        .getByRole("combobox", { name: "Reading", exact: true })
        .selectOption("2");
      await current
        .getByRole("combobox", { name: "Feature", exact: true })
        .selectOption("1");
      await expect(current).toContainText("0.4");
      await expect(current).toContainText("0.5");
      await expect(current).toContainText(/-0\.447213[56]/);
      await expect(current).toContainText(
        "This score does not measure classifier accuracy.",
      );
      await current
        .getByText("Captured values and run details", { exact: true })
        .click();
      await expect(
        current.getByRole("heading", {
          name: "Saved training statistics",
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.getByTestId("challenge-passed-banner")).toHaveAttribute(
        "data-completion-state",
        "saved",
      );
      const history = page.getByRole("region", {
        name: "Saved normalization runs",
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
      expect(
        (
          await new AxeBuilder({ page })
            .include(`[id="${await current.getAttribute("id")}"]`)
            .withTags(["wcag2a", "wcag2aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      const nudge = page.getByTestId("github-nudge-toast");
      if (await nudge.isVisible()) {
        await nudge
          .getByRole("button", { name: "Dismiss", exact: true })
          .click();
      }
      await expectNoPageOverflow(page);
      await current.screenshot({
        path: testInfo.outputPath(
          `normalization-current-result-${width}-${colorScheme}.png`,
        ),
      });
    });

    await test.step("failed retry and guarded restore preserve saved work and the newer draft", async () => {
      const history = page.getByRole("region", {
        name: "Saved normalization runs",
        exact: true,
      });
      const newerCode = "throw new Error('Local review newer draft');";
      await replaceCode(page, newerCode);
      await expect(
        page.getByRole("region", { name: "Result from this run", exact: true }),
      ).toContainText(/code.*changed|different code/i);
      await page
        .getByRole("button", { name: "Restore My Code", exact: true })
        .click();
      await replaceCode(page, newerCode);
      await page
        .getByRole("button", { name: "Run Tests", exact: true })
        .click();
      await expect(page.getByTestId("test-results-panel")).toContainText(
        "Local review newer draft",
      );
      await expect(page.getByTestId("challenge-passed-banner")).toHaveAttribute(
        "data-completion-state",
        "earlier",
      );
      await expect(page.getByTestId("challenge-passed-banner")).toContainText(
        "Your latest checked attempt still needs work.",
      );
      await expect(
        page.getByText("Previous run", { exact: true }),
      ).toBeVisible();
      await history
        .getByRole("button", { name: "Save this run", exact: true })
        .click();
      await expect(
        history.locator("summary").filter({ hasText: "Earlier saved run:" }),
      ).toBeVisible();
      await expect(
        history.locator("summary").filter({ hasText: "Latest saved run:" }),
      ).toBeVisible();
      await history
        .getByRole("button", { name: "Restore saved code", exact: true })
        .first()
        .click();
      await expect(page.locator(".cm-content").first()).not.toContainText(
        newerCode,
      );
      await page.reload();
      await expect(page.locator(".cm-content").first()).toBeVisible();
      await page
        .getByRole("button", { name: "Restore My Code", exact: true })
        .click();
      await expect(page.locator(".cm-content").first()).toContainText(
        newerCode,
      );
      await history
        .locator("summary")
        .filter({ hasText: "Earlier saved run:" })
        .click();
      await expect(
        history.getByRole("combobox", { name: "Reading", exact: true }),
      ).toBeVisible();
      await history
        .getByRole("combobox", { name: "Reading", exact: true })
        .selectOption("2");
      await history
        .getByRole("combobox", { name: "Feature", exact: true })
        .selectOption("1");
      await expect(history).toContainText(/-0\.447213[56]/);
      await expect(
        history
          .getByText(
            "Saved in this browser. Supplied two-feature practice readings",
            { exact: true },
          )
          .first(),
      ).toHaveCSS("font-size", "14px");
      await expect(
        history.getByText(
          "Compare the input with your stored statistics and scaled output. Every value below comes from this run. Numbers round to seven significant digits.",
          { exact: true },
        ),
      ).toHaveCSS("font-size", "16px");
      await expectNoPageOverflow(page);
      await history.screenshot({
        path: testInfo.outputPath(
          `normalization-restored-history-${width}-${colorScheme}.png`,
        ),
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
        { timeout: 60_000 },
      );
      await page
        .getByTestId("challenge-passed-banner")
        .getByRole("button", { name: "Continue", exact: true })
        .click();
    });

    await test.step("recall provides incorrect and corrected feedback before its recap", async () => {
      const cards = page.getByRole("form", {
        name: "Knowledge check",
        exact: true,
      });
      await expect(cards).toHaveCount(2);
      await expect(page.getByTestId("takeaways-prose")).toHaveCount(0);
      await cards
        .nth(0)
        .getByRole("radio", {
          name: "It guarantees that all features have equal importance.",
          exact: true,
        })
        .check();
      await cards
        .nth(0)
        .getByRole("button", { name: "Check answer", exact: true })
        .click();
      await expect(cards.nth(0).getByRole("status")).toContainText(
        "0 of 1 correct",
      );
      await expect(page.getByTestId("takeaways-prose")).toHaveCount(0);
      const correct = cards.nth(0).getByRole("radio", {
        name: "It can make training easier by putting inputs on comparable scales.",
        exact: true,
      });
      await correct.focus();
      await correct.press("Space");
      await cards
        .nth(0)
        .getByRole("button", { name: "Check again", exact: true })
        .click();
      await expect(cards.nth(0).getByRole("status")).toContainText(
        "All answers are correct",
      );
      await cards
        .nth(1)
        .getByRole("radio", { name: "Broadcasting.", exact: true })
        .check();
      await cards
        .nth(1)
        .getByRole("radio", {
          name: "The first column mean from column 1, and the second from column 2.",
          exact: true,
        })
        .check();
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
        path: testInfo.outputPath(
          `normalization-takeaways-${width}-${colorScheme}.png`,
        ),
        fullPage: true,
      });
      await page
        .getByTestId("lesson-nav")
        .getByRole("button", { name: "Continue", exact: true })
        .click();
    });

    await test.step("earned ending runs the real preview and leaves the unknown label unresolved", async () => {
      await expect(page.getByTestId("epilogue")).toBeVisible();
      await expect(
        page.getByRole("complementary", { name: "Closing scene", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("img", {
          name: /Bridge displays settle onto one scale/,
        }),
      ).toBeVisible();
      await expect(
        page.getByText(
          /Demir brings the four scaled feeds onto the bridge displays/,
        ),
      ).toBeVisible();
      await expect(page.getByTestId("deep-scan-demo")).toBeVisible();
      await expect(page.getByTestId("demo-verdict-7741")).toContainText(
        "NEITHER",
        { timeout: 60_000 },
      );
      await expect(page.getByTestId("deep-scan-demo")).toContainText(/51\.\d%/);
      await expect(page.getByTestId("deep-scan-demo")).toContainText(
        "Sample 7741’s true label remains unknown.",
      );
      await expect(
        page.getByText(
          "The preview score goes into the raw capture record. It does not settle the review.",
          { exact: true },
        ),
      ).toBeVisible();
      await expectNoPageOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath(
          `normalization-epilogue-${width}-${colorScheme}.png`,
        ),
        fullPage: true,
      });
    });

    expect(pageErrors).toEqual([]);
  });
}
