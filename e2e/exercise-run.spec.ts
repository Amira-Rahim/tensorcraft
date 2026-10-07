import { test, expect } from "@playwright/test";

/**
 * The one path no other suite exercises end-to-end: a learner clicking
 * "Run Tests" in the real browser. This drives the BROWSER worker transport
 * (importScripts CDN TFJS + shims), which differs from the node worker the
 * corpus test uses. Two invariants:
 *   1. the untouched starter must FAIL (red results panel),
 *   2. the canonical solution must PASS ("All tests passed!").
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
  "const streamValues = [0.12, 0.94, 0.31, 0.88, 0.47];",
  "const reading = tf.tensor(streamValues);",
  "const shape = reading.shape;",
  "const values = reading.arraySync();",
  "reading?.dispose();",
].join("\n");

test.describe("Exercise run in the real browser worker", () => {
  test("starter fails, solution passes, through the shipped pipeline", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.addInitScript(
      ({ stepKey, maxKey }) => {
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
    const results = page.getByTestId("test-results-panel");
    await expect(results).toBeVisible({ timeout: 90_000 });
    await expect(results).not.toContainText("All tests passed!");
    await expect(page.getByTestId("challenge-passed-banner")).toHaveCount(0);

    // 2. Replace editor contents with the canonical solution and re-run.
    const editor = page.locator(".cm-content").first();
    await editor.click();
    await page.keyboard.press(
      process.platform === "darwin" ? "Meta+a" : "Control+a",
    );
    await page.keyboard.press("Delete");
    // insertText avoids CodeMirror auto-indent/auto-close interference.
    await page.keyboard.insertText(SOLUTION);

    await runButton.click();
    await expect(results).toContainText("All tests passed!", {
      timeout: 90_000,
    });
    await expect(
      page
        .getByTestId("challenge-passed-banner")
        .getByRole("list", { name: "Checked work" }),
    ).toContainText("Prepare the Five Readings");
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
