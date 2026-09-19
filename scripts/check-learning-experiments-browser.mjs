import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFileSync } from "node:fs";

export async function runExperimentChecks({ page, lessons }) {
  const cases = [
    ["normalization", "normalization", "1,1", "2,2"],
    ["threshold", "threshold-tuning", "4", "3"],
    ["learning-rate", "gradient-descent", "2", "-1"],
    ["fft", "fourier-transform", "4", "1,2"],
    ["attention", "beyond-lstm", "1", "2.975,7.025"],
    ["cache", "caching-strategies", "2", "3"],
  ];
  const checks = [];
  for (const [width, theme] of [
    [1100, "dark"],
    [375, "light"],
    [320, "dark"],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.evaluate((theme) => {
      document.documentElement.dataset.scheme = theme;
      sessionStorage.clear();
    }, theme);
    for (const [id, slug, prediction, changed] of cases) {
      const index = lessons.findIndex((l) => l.slug === slug);
      expect(index).toBeGreaterThanOrEqual(0);
      await page.evaluate((index) => window.showLesson(index), index);
      const box = page.getByTestId(`experiment-${id}`);
      await expect(box).toHaveCount(1);
      await box.getByRole("textbox").fill("999");
      await box
        .getByRole("button", { name: "Check prediction", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      await expect(box.getByRole("status")).toContainText(
        "The calculation returns",
      );
      await box.getByRole("textbox").fill(prediction);
      await box
        .getByRole("button", { name: "Check prediction", exact: true })
        .click();
      await expect(box.getByRole("status")).toContainText(
        "Your prediction matches",
      );
      if (id === "cache") {
        await box.getByLabel("Cache key", { exact: true }).selectOption("1");
        await box
          .getByRole("button", { name: "Show calculation and help" })
          .click();
        await expect(box.getByRole("table")).toContainText("WRONG reuse");
      }
      if (id === "threshold") {
        // Cost 3 on final test for threshold 0.4: FP=2 and FN=1.
        await box
          .getByRole("button", { name: "Freeze policy and open final test" })
          .click();
      } else
        await box.getByRole("button", { name: "Try a changed case" }).click();
      await box.getByRole("textbox").fill(changed);
      await box
        .getByRole("button", { name: "Check prediction", exact: true })
        .click();
      await expect(box.getByRole("status")).toContainText(
        "Your prediction matches",
      );
      const storageKey = `tensorcraft:experiment:deep-orbit-${id}:v1`;
      const saved = await page.evaluate(
        (key) => JSON.parse(sessionStorage.getItem(key)),
        storageKey,
      );
      expect(saved.prediction.first).toEqual({
        correct: false,
        assisted: false,
      });
      expect(saved.prediction.latest.correct).toBe(true);
      expect(saved.changed_case.first).toEqual({
        correct: true,
        assisted: false,
      });
      await page.evaluate(() => window.showLesson(-1));
      await expect(box).toHaveCount(0);
      await page.evaluate((index) => window.showLesson(index), index);
      await expect(box.getByRole("textbox")).toHaveValue(changed);
      await box.getByRole("button", { name: "Reset controls" }).click();
      if (id === "threshold") {
        await box
          .getByRole("button", {
            name: "Return to worked case (records reference use)",
          })
          .click();
        await expect(box.getByLabel("Alert threshold")).toBeDisabled();
        await box.getByRole("button", { name: "Return to final test" }).click();
      }
      await box
        .getByRole("button", { name: "Show calculation and help" })
        .click();
      const axe = await new AxeBuilder({ page })
        .include(`[data-testid="experiment-${id}"]`)
        .analyze();
      expect(axe.violations).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await box.screenshot({
        path: `test-results/content-review/experiment-${id}-${width}-${theme}.png`,
      });
      if (width === 320) {
        await page.evaluate(
          () => (document.documentElement.style.fontSize = "200%"),
        );
        await page.evaluate(
          () =>
            new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
        );
        const reflow = await page.evaluate(() => ({
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          outside: [...document.querySelectorAll("body *")]
            .filter(
              (el) =>
                el.getBoundingClientRect().right > innerWidth + 1 &&
                !el.closest("pre, table"),
            )
            .map((el) => ({
              tag: el.tagName,
              text: el.textContent.slice(0, 100),
              class: el.className,
              right: el.getBoundingClientRect().right,
            }))
            .slice(-20),
        }));
        if (reflow.scrollWidth > reflow.width + 1)
          console.log(
            "Reflow contributors",
            id,
            await page.evaluate(() =>
              [...document.querySelector(".lesson-prose").children]
                .map((el) => {
                  const before = document.documentElement.scrollWidth,
                    prev = el.style.display;
                  el.style.display = "none";
                  const after = document.documentElement.scrollWidth;
                  el.style.display = prev;
                  return {
                    tag: el.tagName,
                    cls: el.className,
                    text: el.textContent.slice(0, 100),
                    before,
                    after,
                  };
                })
                .filter((r) => r.before !== r.after),
            ),
          );
        expect(
          reflow.scrollWidth,
          `${id}: enlarged-text overflow ${JSON.stringify(reflow.outside)}`,
        ).toBeLessThanOrEqual(reflow.width + 1);
        const table = box.getByRole("region").first();
        await table.focus();
        await page.keyboard.press("ArrowRight");
        await page.evaluate(
          () => (document.documentElement.style.fontSize = ""),
        );
        await page.evaluate(
          () =>
            new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
        );
      }
      checks.push({
        id,
        width,
        theme,
        wrongPrediction: true,
        changedCase: true,
        persistence: true,
        scopedAxe: true,
        accessibilityTree: await box.ariaSnapshot(),
      });
    }
  }
  writeFileSync(
    "test-results/content-review/experiment-results.json",
    JSON.stringify(
      {
        scope:
          "Production MDX and experiment components; local renderer fixture with external boundaries stubbed; no human learning claim",
        checks,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Experiment checks passed: ${checks.length} lesson/viewport flows, wrong predictions, changed cases, saved records, keyboard, scoped axe and reflow.`,
  );
}
