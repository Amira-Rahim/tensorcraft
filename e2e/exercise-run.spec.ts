import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * The one path no other suite exercises end-to-end: a learner clicking
 * "Run Tests" in the real browser. This drives the BROWSER worker transport
 * (importScripts CDN TFJS + shims), which differs from the node worker the
 * corpus test uses. Three invariants:
 *   1. the untouched starter must FAIL (red results panel),
 *   2. filling just the two learner-owned lines must PASS,
 *   3. the canonical solution must PASS ("All tests passed!").
 *
 * Uses the free-tier lesson foundations/01 (create-a-tensor). SOLUTION is a
 * copy of that exercise's solutionCode; packages/content/__tests__/
 * e2e-solution-drift.test.ts fails when the two drift apart.
 * Requires network access for the TFJS CDN script inside the worker.
 */
const LESSON = "/worlds/deep-orbit/foundations/introduction-to-tensors";
const STEP_KEY = "tc_step_deep-orbit_introduction-to-tensors";
const MAX_KEY = "tc_step_max_deep-orbit_introduction-to-tensors";

const SOLUTION = [
  "const streamValues = [2, 20, 5, 8, 3, 18, 7, 8, 4, 16, 6, 9];",
  "const reading = tf.tensor(streamValues);",
  "const shape = reading.shape;",
  "const values = reading.arraySync();",
  "const chartRows = tf.tidy(() => reading.reshape([3, 4]).transpose().arraySync());",
  "reading.dispose();",
].join("\n");

test.describe("Exercise run in the real browser worker", () => {
  test("starter fails, solution passes, through the shipped pipeline", async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    await page.addInitScript(
      ({ stepKey, maxKey }) => {
        localStorage.setItem("tc-cookie-consent", "declined");
        localStorage.setItem(stepKey, "3"); // Challenge step
        localStorage.setItem(maxKey, "3");
      },
      { stepKey: STEP_KEY, maxKey: MAX_KEY },
    );
    await page.goto(LESSON, { waitUntil: "domcontentloaded" });

    const runButton = page.getByRole("button", { name: "Run Tests" });
    await expect(runButton).toBeVisible({ timeout: 30_000 });

    // 1. Untouched starter must not pass (worker + CDN TFJS + harness all real).
    await runButton.click();
    await expect(runButton).toBeEnabled({ timeout: 90_000 });
    const results = page.getByTestId("test-results-panel");
    await expect(results).toBeVisible({ timeout: 90_000 });
    await expect(results).not.toContainText("All tests passed!");
    await expect(page.getByTestId("challenge-passed-banner")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Inspect result", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("region", { name: "Explanation of your captured result" }),
    ).toHaveCount(0);

    // 2. Complete only the two blanks; keep the supplied readback and cleanup.
    const editor = page.locator(".cm-content").first();
    const starter = await editor.innerText();
    expect(starter.match(/= null;/g)).toHaveLength(2);
    const completed = starter
      .replace(
        "const reading = null;",
        "const reading = tf.tensor(streamValues);",
      )
      .replace("const shape = null;", "const shape = reading.shape;");
    await editor.click();
    await page.keyboard.press(
      process.platform === "darwin" ? "Meta+a" : "Control+a",
    );
    await page.keyboard.press("Delete");
    await page.keyboard.insertText(completed);
    await runButton.click();
    await expect(runButton).toBeEnabled({ timeout: 90_000 });
    await expect(results).toContainText("All tests passed!", {
      timeout: 90_000,
    });

    const inspection = page.getByRole("region", {
      name: "Explanation of your captured result",
    });
    await expect(inspection).toBeVisible();
    await inspection
      .getByRole("combobox", { name: "Sensor", exact: true })
      .selectOption("3");
    await inspection
      .getByRole("combobox", { name: "Selected moment", exact: true })
      .selectOption("1");
    await expect(
      inspection.getByText("Index in supplied flat list").locator(".."),
    ).toContainText("7");
    await expect(
      inspection
        .getByRole("status")
        .filter({ hasText: "Sensor D at selected moment 2" }),
    ).toContainText("run reports 8");
    await expect(
      inspection.getByRole("button", { name: "Sensor D", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");

    // 3. The canonical solution still passes independently.
    await editor.click();
    await page.keyboard.press(
      process.platform === "darwin" ? "Meta+a" : "Control+a",
    );
    await page.keyboard.press("Delete");
    // insertText avoids CodeMirror auto-indent/auto-close interference.
    await page.keyboard.insertText(SOLUTION);

    await runButton.click();
    await expect(runButton).toBeEnabled({ timeout: 90_000 });
    await expect(results).toContainText("All tests passed!", {
      timeout: 90_000,
    });
    await expect(
      inspection.getByRole("combobox", { name: "Sensor", exact: true }),
    ).toHaveValue("0");
    await expect(
      inspection.getByRole("combobox", {
        name: "Selected moment",
        exact: true,
      }),
    ).toHaveValue("0");
    // The verdict on the current code belongs to the results panel above and
    // its live region. The banner reports the saved completion and carries
    // the way forward, because it outlives later edits to the code (content
    // fix 10, 32022a1b). A guest's pass is saved in this browser.
    await expect(
      page.getByRole("status").filter({ hasText: /^All \d+ tests passed\.$/ }),
    ).toHaveCount(1);
    const banner = page.getByTestId("challenge-passed-banner");
    await expect(banner).toHaveAttribute("data-completion-state", "saved");
    await expect(banner).toContainText("Completion saved");
    await expect(banner).toContainText("We saved your exercise completion.");
    await expect(
      banner.getByRole("list", { name: "Completed exercises" }),
    ).toHaveCount(0);
    await expect(
      banner.getByText("Completion saved", { exact: true }),
    ).toHaveCSS("font-weight", "700");
    // The workspace's pass result owns the next action. No second Continue
    // at the bottom of the page competes with it.
    await expect(
      page.getByRole("button", { name: "Continue", exact: true }),
    ).toHaveCount(1);
    // Results open in the checks under the code and must not open a gap
    // between the brief and the code: the editor frame still starts where
    // the brief ends (spec 2026-10-10).
    const briefBox = (await page.getByTestId("exercise-brief").boundingBox())!;
    const editorFrameBox = (await page
      .locator("[data-editor-frame]")
      .boundingBox())!;
    expect(
      Math.abs(editorFrameBox.y - (briefBox.y + briefBox.height)),
    ).toBeLessThanOrEqual(1);
    await inspection.screenshot({
      path: testInfo.outputPath("captured-result-desktop.png"),
    });
    expect(
      (
        await new AxeBuilder({ page })
          .include('[aria-label="Explanation of your captured result"]')
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath("challenge-passed-desktop.png"),
      fullPage: true,
      style: "nextjs-portal { display: none !important; }",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(editor).toBeVisible();
    await expect(page.getByTestId("exercise-brief")).toBeVisible();
    await expect(page.getByTestId("challenge-passed-banner")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
    await inspection.screenshot({
      path: testInfo.outputPath("captured-result-phone.png"),
    });
    await page.screenshot({
      path: testInfo.outputPath("challenge-passed-phone.png"),
      fullPage: true,
      style: "nextjs-portal { display: none !important; }",
    });

    await editor.click();
    await page.keyboard.press(
      process.platform === "darwin" ? "Meta+a" : "Control+a",
    );
    await page.keyboard.insertText(
      SOLUTION + "\n// Edited after the captured run.",
    );
    await expect(inspection).toContainText(
      "This explanation belongs to the submitted code.",
    );
    await expect(inspection).toContainText(
      "Your code has changed. Run it again to update these results.",
    );
    expect(
      (
        await new AxeBuilder({ page })
          .include('[aria-label="Explanation of your captured result"]')
          .analyze()
      ).violations,
    ).toEqual([]);
  });
});

/**
 * Keyboard-access contract for the editor scroller (backlog B9).
 *
 * The 16px editor type overflows the 400px editor cap on most starters, so
 * `.cm-scroller` scrolls. axe does not count CodeMirror's contenteditable
 * surface as focusable content, which makes an unfocusable scroller a WCAG
 * 2.1.1 failure (scrollable-region-focusable): keyboard users could never
 * reach the hidden lines. The Exercise component applies these attributes
 * after CodeMirror mounts; this test names that contract so a Sandpack or
 * CodeMirror upgrade that drops it fails here, not only in the axe sweep.
 */
test.describe("Exercise editor keyboard access", () => {
  test("the editor scroller is focusable with a role and name", async ({
    page,
  }) => {
    await page.addInitScript(
      ({ stepKey, maxKey }) => {
        localStorage.setItem(stepKey, "3"); // Challenge step
        localStorage.setItem(maxKey, "3");
      },
      { stepKey: STEP_KEY, maxKey: MAX_KEY },
    );
    await page.goto(LESSON, { waitUntil: "domcontentloaded" });

    const scroller = page.locator(".cm-scroller").first();
    await expect(scroller).toBeVisible({ timeout: 30_000 });
    await expect(scroller).toHaveAttribute("tabindex", "0", {
      timeout: 30_000,
    });
    await expect(scroller).toHaveAttribute("role", "group");
    await expect(scroller).toHaveAttribute("aria-label", "Code editor");
  });
});
