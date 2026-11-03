import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { ExerciseData } from "@tensorcraft/ui";
import type { NetworkFixtureContent } from "./fixtures/network-evidence-contract";

const root = process.cwd();
const contentRequire = createRequire(
  path.join(root, "packages/content/package.json"),
);
const { parse } = createRequire(contentRequire.resolve("velite"))("yaml");
// Vite already depends on esbuild. Bundle test-only components without adding a
// public route that could expose paid exercise content.
const { build } = createRequire(require.resolve("vite"))("esbuild");
const exercise = (location: string): ExerciseData =>
  parse(
    readFileSync(
      path.join(root, "packages/content/content/deep-orbit", location),
      "utf8",
    ),
  );
const content: NetworkFixtureContent = {
  normalization: exercise("foundations/exercises/normalize-data.yaml"),
  network: exercise("neural-networks/exercises/simple-network.yaml"),
};
let fixtureScript: string;

test.beforeAll(async () => {
  const bundle = await build({
    entryPoints: [path.join(root, "e2e/fixtures/trained-network-evidence.tsx")],
    bundle: true,
    format: "iife",
    write: false,
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"development"' },
    alias: {
      "@": path.join(root, "apps/web"),
      "@tensorcraft/ui": path.join(root, "packages/ui/src/index.ts"),
      "@tensorcraft/shared": path.join(root, "packages/shared/src/index.ts"),
      "@tensorcraft/worlds": path.join(root, "packages/worlds/src/index.ts"),
      "next/link": path.join(root, "e2e/fixtures/test-link.tsx"),
    },
  });
  fixtureScript = bundle.outputFiles[0].text;
});

async function mount(page: Page, legacy: boolean) {
  await page.addScriptTag({ content: fixtureScript });
  await page.evaluate(
    async ({ content, legacy }) =>
      window.tcNetworkEvidenceFixture.mount(content, legacy),
    { content, legacy },
  );
  await expect(
    page.getByTestId("network-evidence-fixture").locator(".cm-content"),
  ).toBeVisible();
}

test.use({ actionTimeout: 30_000 });

test("the actual trained-network lesson remains gated for guests", async ({
  page,
}) => {
  await page.goto("/worlds/deep-orbit/neural-networks/building-a-network");
  await expect(page).toHaveURL(
    /\/pricing\?locked=deep-orbit&module=neural-networks/,
  );
  await expect(page.locator(".cm-content")).toHaveCount(0);
});

for (const width of [1440, 390]) {
  test(`trained-network browser capture and recovery at ${width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() =>
      localStorage.setItem("tc-cookie-consent", "declined"),
    );
    // Load the real lesson styles and vendored TFJS origin. The test fixture
    // supplies paid content locally, without altering the actual route gate.
    await page.goto(
      "/worlds/deep-orbit/foundations/normalization?start=challenge",
    );
    await mount(page, true);
    const fixture = page.getByTestId("network-evidence-fixture");
    const panel = fixture.getByRole("region", { name: "Saved network runs" });
    const editor = fixture.locator(".cm-content");
    await fixture
      .getByRole("button", { name: "Show Solution", exact: true })
      .click();
    await fixture
      .getByRole("button", { name: "Run Tests", exact: true })
      .click();
    await expect(fixture.getByTestId("test-results-panel")).toContainText(
      "All tests passed!",
      { timeout: 60_000 },
    );
    await panel
      .getByRole("button", { name: "Save this run", exact: true })
      .click();
    await expect(
      panel.getByRole("button", { name: "Run saved", exact: true }),
    ).toBeVisible();
    await panel.locator("summary").filter({ hasText: "Saved run:" }).click();
    await expect(panel).toContainText("training");
    await expect(panel.getByRole("combobox")).toBeVisible();
    const settings = panel.getByRole("region", {
      name: "Captured training settings",
    });
    await expect(settings).toBeVisible();
    await expect(settings).toContainText("Rows passed to fit");
    await expect(settings).toContainText("120");
    expect(
      await panel
        .locator("[data-exercise-y-tick]")
        .evaluateAll(
          (ticks) =>
            ticks.length > 0 &&
            ticks.every(
              (tick) => (tick as SVGGraphicsElement).getBBox().x >= 0,
            ),
        ),
    ).toBe(true);
    const first = await page.evaluate(() =>
      window.tcNetworkEvidenceFixture.records(),
    );
    expect(first.map((run) => run.exerciseSlug)).toEqual([
      "normalize-data",
      "simple-network",
    ]);
    const modelRun = first[1];
    expect(modelRun.runtimeVersion).toBe("4.22.0");
    expect(modelRun.backend).toBe("cpu");
    expect(modelRun.artifacts).toHaveLength(4);
    expect(modelRun.selectedRowIds).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 60, 61, 62, 63, 64, 65, 66, 67,
    ]);
    const losses = modelRun.artifacts.find((a) => a.kind === "series");
    expect(losses?.kind === "series" && losses.labels.length).toBe(50);
    expect(modelRun.assistance.solutionViewed).toBe(true);
    expect(modelRun).not.toHaveProperty("testCode");
    await panel.screenshot({
      path: testInfo.outputPath(`trained-network-${width}.png`),
    });

    await fixture
      .getByRole("button", { name: "Restore My Code", exact: true })
      .click();
    const newer = "throw new Error('Failed training retry');";
    await editor.click();
    await page.keyboard.press(
      process.platform === "darwin" ? "Meta+a" : "Control+a",
    );
    await page.keyboard.insertText(newer);
    await fixture
      .getByRole("button", { name: "Run Tests", exact: true })
      .click();
    await expect(fixture.getByTestId("test-results-panel")).toContainText(
      "Failed training retry",
    );
    await panel
      .getByRole("button", { name: "Save this run", exact: true })
      .click();
    await expect(
      panel.locator("summary").filter({ hasText: "Latest saved run:" }),
    ).toBeVisible();
    expect(
      (
        await page.evaluate(() => window.tcNetworkEvidenceFixture.records())
      ).map((run) => run.exerciseSlug),
    ).toEqual(["normalize-data", "simple-network", "simple-network"]);
    await panel
      .getByRole("button", { name: "Restore saved code", exact: true })
      .first()
      .click();
    await page.reload();
    await mount(page, false);
    await fixture
      .getByRole("button", { name: "Restore My Code", exact: true })
      .click();
    await expect(editor).toContainText(newer);
    await fixture
      .getByRole("button", { name: "Normalization fixture", exact: true })
      .click();
    await expect(
      fixture.getByRole("region", { name: "Saved normalization runs" }),
    ).toContainText("Saved run:");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
    ).toBe(false);
  });
}
