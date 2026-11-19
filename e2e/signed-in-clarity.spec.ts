import { expect, test, type Page, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertLocalReviewReady,
  completeAlexModule,
  loginReviewAccount,
  REVIEW_ACCOUNTS,
  resetAlexLesson,
} from "./helpers/local-review";
const prerequisites = [
  "foundations",
  "neural-networks",
  "training-loop",
  "browser-runtimes",
  "signal-processing",
  "recurrent-networks",
  "anomaly-detection",
  "advanced-time-series",
  "llm-integration",
  "optimization-edge",
] as const;
const compiled = JSON.parse(
  readFileSync(resolve("packages/content/.velite/exercises.json"), "utf8"),
) as { slug: string; solutionCode: string }[];
const solution = (slug: string) => {
  const value = compiled.find((x) => x.slug === slug)?.solutionCode;
  if (!value) throw Error("Missing exercise");
  return value;
};
async function replace(page: Page, pane: Locator, code: string) {
  const editor = pane.locator(".cm-content").first();
  await editor.click();
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+a" : "Control+a",
  );
  await page.keyboard.insertText(code);
  await expect(editor).toContainText(code.trim().split("\n").at(-1)!.trim(), {
    useInnerText: true,
  });
}
async function run(pane: Locator) {
  const button = pane.getByRole("button", { name: "Run Tests", exact: true });
  await button.click();
  await expect(button).toBeEnabled({ timeout: 90000 });
  await expect(pane.getByTestId("test-results-panel")).toContainText(
    "All tests passed!",
  );
}
async function enter(
  page: Page,
  lesson: string,
  module: string,
  width: number,
  scheme: "light" | "dark",
) {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
  await page.addInitScript(
    ({ lesson, owner, scheme }) => {
      localStorage.setItem("tc-cookie-consent", "declined");
      localStorage.setItem("tc-scheme", scheme);
      localStorage.setItem("tc-script-skip", "1");
      for (const prefix of ["tc_step_v2_", "tc_step_max_v2_"])
        localStorage.setItem(
          `${prefix}deep-orbit_${lesson}:account:${owner}`,
          "2",
        );
    },
    { lesson, owner: REVIEW_ACCOUNTS.alex.id, scheme },
  );
  await loginReviewAccount(
    page,
    "alex",
    `/worlds/deep-orbit/${module}/${lesson}`,
  );
}
async function inspect(page: Page, scope: Locator, width: number) {
  const nudge = page.getByTestId("github-nudge-toast");
  if (await nudge.isVisible())
    await nudge.getByRole("button", { name: "Dismiss", exact: true }).click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(width);
  await scope.evaluate((el) => el.setAttribute("data-clarity-check", "true"));
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-clarity-check="true"]')
        .analyze()
    ).violations,
  ).toEqual([]);
  if (await nudge.isVisible())
    await nudge.getByRole("button", { name: "Dismiss", exact: true }).click();
}
test.beforeAll(async () => {
  await assertLocalReviewReady();
  for (const module of prerequisites) await completeAlexModule(module);
});
for (const item of [
  {
    slug: "compute-fft",
    lesson: "fourier-transform",
    module: "signal-processing",
    control: null,
  },
  {
    slug: "build-spectrogram",
    lesson: "spectrograms",
    module: "signal-processing",
    control: "Captured frame",
  },
  {
    slug: "pipeline-architecture",
    lesson: "system-architecture",
    module: "capstone",
    control: "FFT bin",
  },
  {
    slug: "write-model-card",
    lesson: "documentation",
    module: "capstone",
    control: "Card line",
  },
] as const) {
  test(`actual ${item.slug} result and ordinary capture`, async ({
    page,
  }, info) => {
    const width = 320;
    await enter(page, item.lesson, item.module, width, "dark");
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const pane = page.getByTestId("exercise-pane").first();
    await expect(pane.locator(".cm-content")).toBeVisible();
    await replace(page, pane, solution(item.slug));
    await run(pane);
    const viewer = pane.getByRole("region", {
      name: "Explanation of your captured result",
      exact: true,
    });
    await expect(viewer).toBeVisible();
    if (item.control) {
      const select = viewer.getByRole("combobox", {
        name: item.control,
        exact: true,
      });
      await select.selectOption(
        item.slug === "build-spectrogram"
          ? "1"
          : item.slug === "pipeline-architecture"
            ? "4"
            : "8",
      );
    }
    if (item.slug === "build-spectrogram")
      await expect(
        viewer
          .getByText("Captured raw magnitude at 40 Hz", { exact: true })
          .locator("..")
          .locator("dd"),
      ).toHaveText("32");
    if (item.slug === "pipeline-architecture")
      expect(
        Number(
          await viewer
            .getByText("Captured magnitude", { exact: true })
            .locator("..")
            .locator("dd")
            .innerText(),
        ),
      ).toBeCloseTo(8, 4);
    if (item.slug === "write-model-card")
      await expect(
        viewer.getByLabel("Selected captured card line"),
      ).toContainText("84.0%");
    await inspect(page, viewer, width);
    await viewer.screenshot({
      path: info.outputPath(`${item.slug}-actual.png`),
      caret: "initial",
    });
    await replace(
      page,
      pane,
      solution(item.slug) + "\n// Edited after capture",
    );
    await expect(viewer).toContainText("The editor has changed.");
    expect(errors).toEqual([]);
  });
}
for (const width of [390, 320])
  test(`three mounted launch tasks retain drafts and results at ${width}px`, async ({
    page,
  }, info) => {
    await resetAlexLesson("launch");
    await enter(
      page,
      "launch",
      "capstone",
      width,
      width === 390 ? "light" : "dark",
    );
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const tasks = [
      { slug: "verify-deployment", title: "Deployment verification" },
      {
        slug: "launch-rehearsal",
        title: "Launch rehearsal and candidate evaluation",
      },
      {
        slug: "classify-anomaly",
        title: "The anomaly classification at launch",
      },
    ];
    const outline = page.getByRole("navigation", {
      name: "Lesson tasks",
      exact: true,
    });
    await expect(outline).toBeVisible();
    await expect(outline.getByRole("link")).toHaveText(
      tasks.map((t) => t.title),
    );
    const panes = page.getByTestId("exercise-pane");
    await expect(panes).toHaveCount(3);
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]!,
        pane = panes.nth(i);
      await expect(pane).toHaveAttribute("id", `launch-editor-${task.slug}`);
      await expect(pane.getByTestId("exercise-pane-title")).toHaveText(
        task.title,
      );
      await expect(page.locator(`#launch-brief-${task.slug}`)).toHaveCount(1);
    }
    // Two distinct drafts and one completed result must survive anchor movement without remounting.
    await replace(
      page,
      panes.nth(0),
      solution(tasks[0]!.slug) + "\n// Verification draft marker",
    );
    await replace(
      page,
      panes.nth(1),
      solution(tasks[1]!.slug) + "\n// Rehearsal draft marker",
    );
    await run(panes.nth(0));
    const checks = panes.nth(0).getByTestId("test-results-panel");
    await expect(checks).toContainText("All tests passed!");
    await expect(page.getByTestId("challenge-passed-banner")).toHaveCount(0);
    await outline
      .getByRole("link", { name: tasks[1]!.title, exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(
      page.locator(`#launch-editor-${tasks[1]!.slug}`),
    ).toBeFocused();
    await panes
      .nth(1)
      .getByRole("link", {
        name: `Back to ${tasks[1]!.title} brief`,
        exact: true,
      })
      .click();
    await expect(page.locator(`#launch-brief-${tasks[1]!.slug}`)).toBeFocused();
    await expect(checks).toContainText("All tests passed!");
    await expect(panes.nth(0).locator(".cm-content")).toContainText(
      "Verification draft marker",
    );
    await expect(panes.nth(1).locator(".cm-content")).toContainText(
      "Rehearsal draft marker",
    );
    await run(panes.nth(1));
    await replace(page, panes.nth(2), solution(tasks[2]!.slug));
    await run(panes.nth(2));
    await expect(page.getByTestId("challenge-passed-banner")).toHaveAttribute(
      "data-completion-state",
      "saved",
    );
    await inspect(page, panes.nth(0), width);
    await panes.nth(0).screenshot({
      path: info.outputPath(`launch-anchor-${width}.png`),
      caret: "initial",
    });
    await page.reload();
    await expect(panes).toHaveCount(3);
    for (const [index, marker] of [
      [0, "Verification draft marker"],
      [1, "Rehearsal draft marker"],
    ] as const) {
      const saved = await page.evaluate(
        ({ slug, owner }) =>
          JSON.parse(
            localStorage.getItem(`tc-code-${slug}:account:${owner}`) ?? "null",
          ),
        { slug: tasks[index]!.slug, owner: REVIEW_ACCOUNTS.alex.id },
      );
      expect(saved.code).toContain(marker);
      // CodeMirror virtualizes long documents. Reveal the restored last line.
      await panes.nth(index).locator(".cm-content").click();
      await page.keyboard.press(
        process.platform === "darwin" ? "Meta+ArrowDown" : "Control+End",
      );
      await expect(panes.nth(index).locator(".cm-content")).toContainText(
        marker,
      );
    }
    await expect(panes.nth(0).locator(".cm-content")).toContainText(
      "Verification draft marker",
    );
    await expect(panes.nth(1).locator(".cm-content")).toContainText(
      "Rehearsal draft marker",
    );
    await expect(page.getByTestId("challenge-passed-banner")).toHaveAttribute(
      "data-completion-state",
      "saved",
    );
    expect(errors).toEqual([]);
  });
