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

test.beforeAll(assertLocalReviewReady);
const compiled = JSON.parse(
  readFileSync(resolve("packages/content/.velite/exercises.json"), "utf8"),
) as { slug: string; solutionCode: string }[];
const canonical = (slug: string) => {
  const code = compiled.find((row) => row.slug === slug)?.solutionCode;
  if (!code) throw Error("Missing compiled exercise");
  return code;
};
const cases = [
  {
    slug: "browser-ml-tradeoffs",
    lesson: "why-the-browser",
    width: 390,
    scheme: "light",
    pane: 0,
    artifacts: 3,
    control: "Policy probe",
  },
  {
    slug: "inference-pipeline",
    lesson: "inference-pipeline",
    width: 320,
    scheme: "dark",
    pane: 0,
    artifacts: 4,
    control: "Feature",
  },
  {
    slug: "incident-tensor-leak",
    lesson: "inference-pipeline",
    width: 390,
    scheme: "light",
    pane: 1,
    artifacts: 2,
    control: "Projection calculation",
  },
  {
    slug: "onnx-comparison",
    lesson: "onnx-runtime-web",
    width: 320,
    scheme: "dark",
    pane: 0,
    artifacts: 2,
    control: "Input position",
  },
  {
    slug: "load-pretrained-pipeline",
    lesson: "transformers-js",
    width: 390,
    scheme: "light",
    pane: 0,
    artifacts: 2,
    control: "Original report",
  },
] as const;
async function replaceCode(page: Page, pane: Locator, code: string) {
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
async function run(pane: Locator, passes: boolean) {
  const button = pane.getByRole("button", { name: "Run Tests", exact: true });
  await button.click();
  await expect(button).toBeEnabled({ timeout: 90000 });
  const checks = pane.getByTestId("test-results-panel");
  await expect(checks).toBeVisible();
  if (passes) await expect(checks).toContainText("All tests passed!");
  else await expect(checks).not.toContainText("All tests passed!");
}
for (const item of cases) {
  test(`actual paid ${item.slug} captured result at ${item.width}px`, async ({
    page,
  }, testInfo) => {
    for (const moduleId of [
      "foundations",
      "neural-networks",
      "training-loop",
    ] as const)
      await completeAlexModule(moduleId);
    await page.setViewportSize({ width: item.width, height: 900 });
    await page.emulateMedia({
      colorScheme: item.scheme,
      reducedMotion: "reduce",
    });
    await page.addInitScript(
      ({ owner, lesson }) => {
        localStorage.setItem("tc-cookie-consent", "declined");
        localStorage.setItem("tc-script-skip", "1");
        for (const prefix of ["tc_step_v2_", "tc_step_max_v2_"])
          localStorage.setItem(
            `${prefix}deep-orbit_${lesson}:account:${owner}`,
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
      `/worlds/deep-orbit/browser-runtimes/${item.lesson}`,
    );
    const panes = page.getByTestId("exercise-pane"),
      pane = panes.nth(item.pane);
    await expect(pane.locator(".cm-content")).toBeVisible();
    const viewer = pane.getByRole("region", {
      name:
        item.lesson === "inference-pipeline"
          ? `${item.pane === 0 ? "Inference pipeline" : "Tensor capacity estimate"}: explanation of your captured result`
          : "Explanation of your captured result",
      exact: true,
    });
    const value = (label: string) =>
      viewer.getByText(label, { exact: true }).locator("..").locator("dd");
    await run(pane, false);
    await expect(viewer).toHaveCount(0);
    const code = canonical(item.slug);
    await replaceCode(page, pane, code);
    await run(pane, true);
    await expect(viewer).toBeVisible();
    if (item.lesson === "inference-pipeline") {
      const other = panes.nth(item.pane === 0 ? 1 : 0),
        otherSlug =
          item.pane === 0 ? "incident-tensor-leak" : "inference-pipeline";
      await replaceCode(page, other, canonical(otherSlug));
      await run(other, true);
      await expect(panes).toHaveCount(2);
    }
    await expect(page.getByTestId("challenge-passed-banner")).toHaveAttribute(
      "data-completion-state",
      "saved",
    );
    await expect(viewer.locator("[data-exercise-output-title]")).toHaveCount(
      item.artifacts,
    );
    await pane
      .getByRole("link", { name: "Inspect result", exact: true })
      .click();
    const select = viewer.getByRole("combobox", {
      name: item.control,
      exact: true,
    });
    const choice =
      item.slug === "browser-ml-tradeoffs"
        ? "4"
        : item.slug === "inference-pipeline"
          ? "2"
          : item.slug === "incident-tensor-leak"
            ? "4"
            : item.slug === "onnx-comparison"
              ? "2"
              : "1";
    await select.selectOption(choice);
    if (item.slug === "browser-ml-tradeoffs")
      await expect(value("Reference from the stated policy")).toHaveText(
        "server",
      );
    if (item.slug === "inference-pipeline") {
      await expect(value("Observed value at model.predict")).toHaveText("0.75");
      await expect(value("Your selected-class score")).toHaveText("0.75");
    }
    if (item.slug === "incident-tensor-leak") {
      await expect(value("Selected calculation reference")).toHaveText("79");
      await expect(value("Your returned hours to budget")).toHaveText("79");
    }
    if (item.slug === "onnx-comparison") {
      await expect(value("All three observed inputs match")).toHaveText("true");
      await expect(value("Your returned outputsAgree")).toHaveText("true");
    }
    if (item.slug === "load-pretrained-pipeline") {
      await expect(value("Your returned label")).toHaveText("NEG");
      await expect(value("Returned queue position")).toHaveText("1");
    }
    const browserCheck = async () => {
      const nudge = page.getByTestId("github-nudge-toast");
      if (await nudge.isVisible())
        await nudge
          .getByRole("button", { name: "Dismiss", exact: true })
          .click();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(item.width);
      expect(
        (
          await new AxeBuilder({ page })
            .include(
              '[aria-label="Explanation of your captured result"], [aria-label$=": explanation of your captured result"]',
            )
            .analyze()
        ).violations,
      ).toEqual([]);
      if (await nudge.isVisible())
        await nudge
          .getByRole("button", { name: "Dismiss", exact: true })
          .click();
    };
    await browserCheck();
    await viewer.screenshot({
      path: testInfo.outputPath(`${item.slug}-actual.png`),
      caret: "initial",
    });
    await run(pane, true);
    await expect(select).toHaveValue("0");
    let partial = code;
    if (item.slug === "browser-ml-tradeoffs")
      partial = code.replace(
        /mustStayLocal\s*\?\s*'reconsider'\s*:\s*'server'/,
        "'server'",
      );
    if (item.slug === "inference-pipeline")
      partial = code.replace(
        /confidence:\s*p\s*>\s*0\.5\s*\?\s*p\s*:\s*1\s*-\s*p/,
        "confidence: p",
      );
    if (item.slug === "incident-tensor-leak")
      partial = code.replace(
        /\(budgetTensors\s*-\s*last\.numTensors\)\s*\/\s*ratePerHour/,
        "budgetTensors / ratePerHour",
      );
    if (item.slug === "onnx-comparison")
      partial = code.replace(
        /outputsAgree:\s*Math\.abs\(tfjsValue\s*-\s*onnxValue\)\s*<=\s*0\.0001/,
        "outputsAgree: false",
      );
    if (item.slug === "load-pretrained-pipeline")
      partial = code.replace(
        "const predictions = await classifier(reports);",
        "const predictions = await classifier(reports); predictions.sort((a,b)=>b.score-a.score);",
      );
    expect(partial).not.toBe(code);
    await replaceCode(page, pane, partial);
    await expect(viewer).toContainText("The editor has changed.");
    await run(pane, false);
    await expect(viewer).toContainText("Some checks still need attention.");
    if (item.slug === "browser-ml-tradeoffs") {
      await expect(value("Your returned recommendation")).toHaveText("server");
      await expect(value("Reference from the stated policy")).toHaveText(
        "reconsider",
      );
    }
    if (item.slug === "inference-pipeline") {
      await expect(value("Your selected-class score")).toHaveText("0.25");
      await expect(value("Score from the stated class rule")).toHaveText(
        "0.75",
      );
    }
    if (item.slug === "incident-tensor-leak")
      expect(
        Number(await value("Your returned hours to budget").innerText()),
      ).toBeCloseTo(10000 / 120, 4);
    if (item.slug === "onnx-comparison") {
      await expect(value("Your returned outputsAgree")).toHaveText("false");
      await expect(value("Reference outputs agree")).toHaveText("true");
    }
    if (item.slug === "load-pretrained-pipeline") {
      await select.selectOption("1");
      await expect(value("Your returned label")).toHaveText("POS");
      await expect(value("Supplied sentiment label")).toHaveText("NEG");
    }
    await browserCheck();
    await viewer.screenshot({
      path: testInfo.outputPath(`${item.slug}-partial.png`),
      caret: "initial",
    });
    await replaceCode(page, pane, `${partial}\n// Edit after capture.\n`);
    await expect(viewer).toContainText("The editor has changed.");
    await expect(viewer).toContainText("Run it again to update these results.");
    expect(errors).toEqual([]);
    writeFileSync(
      testInfo.outputPath("runtime-result-evidence.json"),
      JSON.stringify(
        {
          ...item,
          fictionalLocalAccount: "Alex",
          actualBrowserWorker: true,
          starterRejected: true,
          rerunReset: true,
          completionSaved: true,
          usefulFailure: true,
          staleEdit: true,
          scopedAxeScans: 2,
          pageErrors: errors,
        },
        null,
        2,
      ),
    );
  });
}
