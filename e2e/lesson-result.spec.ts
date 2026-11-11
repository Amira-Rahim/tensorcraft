import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createServer, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

// Browser-only presentation regression. Worker capture/decoder integration
// has a separate real-execution test and is not claimed by this fixture.
const root = process.cwd();
const webRequire = createRequire(path.join(root, "apps/web/package.json"));
let server: ViteDevServer;
let base: string;
let localFonts = false;

test.beforeAll(async () => {
  const tailwind = (await import(webRequire.resolve("@tailwindcss/postcss")))
    .default;
  const media = new Map<string, string>();
  const chunks = path.join(root, "apps/web/.next/dev/static/chunks");
  let fontCss = "";
  if (existsSync(chunks)) {
    for (const file of readdirSync(chunks).filter((name) =>
      /^\[next\]_internal_font_google_(inter|jetbrains_mono).*\.css$/.test(
        name,
      ),
    )) {
      fontCss += (
        readFileSync(path.join(chunks, file), "utf8").match(
          /@font-face\s*\{[^}]*\}/g,
        ) ?? []
      )
        .join("\n")
        .replace(/\.\.\/media\/([^"')]+)/g, (_match, name: string) => {
          const location = path.join(
            root,
            "apps/web/.next/dev/static/media",
            name,
          );
          if (existsSync(location)) media.set(name, location);
          return `/__lesson-result-fonts/${name}`;
        });
    }
    localFonts =
      fontCss.includes("font-family: Inter;") &&
      fontCss.includes("font-family: JetBrains Mono;");
  }
  const html = `<!doctype html><html lang="en" data-world="deep-orbit" data-scheme="dark" style="--font-inter:Inter;--font-jetbrains-mono:'JetBrains Mono'"><head><title>Lesson result browser verification</title><style>${fontCss}</style></head><body><div id="root"></div><script type="module" src="/e2e/fixtures/lesson-result.tsx"></script></body></html>`;
  server = await createServer({
    root,
    configFile: false,
    cacheDir: path.join(root, "node_modules/.vite/lesson-result-browser"),
    publicDir: path.join(root, "apps/web/public"),
    optimizeDeps: { entries: ["e2e/fixtures/lesson-result.tsx"] },
    server: {
      host: "127.0.0.1",
      port: 0,
      hmr: false,
      watch: {
        ignored: ["**/.review/**", "**/.next/**", "**/test-results/**"],
      },
    },
    resolve: {
      alias: {
        react: path.join(root, "packages/ui/node_modules/react"),
        "react-dom": path.join(root, "packages/ui/node_modules/react-dom"),
        "@tensorcraft/shared": path.join(root, "packages/shared/src"),
        "@tensorcraft/worlds": path.join(root, "packages/worlds/src"),
        "@tensorcraft/ui": path.join(root, "packages/ui/src"),
        "next/link": path.join(root, "e2e/fixtures/test-link.tsx"),
        "@": path.join(root, "apps/web"),
      },
    },
    css: { postcss: { plugins: [tailwind()] } },
    plugins: [
      react(),
      {
        name: "local-lesson-result-fixture",
        configureServer(instance) {
          instance.middlewares.use(
            "/__lesson-result-fonts",
            (request, response) => {
              const location = media.get(
                decodeURIComponent((request.url ?? "").replace(/^\//, "")),
              );
              if (!location) {
                response.statusCode = 404;
                response.end();
                return;
              }
              response.setHeader("Content-Type", "font/woff2");
              response.end(readFileSync(location));
            },
          );
          instance.middlewares.use(
            "/__lesson-result",
            async (_request, response, next) => {
              try {
                response.setHeader("Content-Type", "text/html");
                response.end(
                  await instance.transformIndexHtml("/__lesson-result", html),
                );
              } catch (error) {
                next(error);
              }
            },
          );
        },
      },
    ],
  });
  await server.listen();
  const address = server.httpServer!.address();
  if (!address || typeof address === "string")
    throw Error("No loopback fixture address");
  base = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await server?.close();
});

for (const width of [1440, 390, 320]) {
  for (const scheme of ["dark", "light"] as const) {
    test(`linked captured results at ${width}px in ${scheme}`, async ({
      page,
      context,
    }, testInfo) => {
      test.setTimeout(120000);
      await page.setViewportSize({ width, height: 900 });
      const reducedMotion = width !== 1440;
      await page.emulateMedia({
        reducedMotion: reducedMotion ? "reduce" : "no-preference",
        colorScheme: scheme,
      });
      const external: string[] = [],
        errors: string[] = [],
        failedRequests: string[] = [];
      await context.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (["blob:", "data:"].includes(url.protocol) || url.origin === base)
          return route.continue();
        external.push(url.origin);
        return route.abort();
      });
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("requestfailed", (request) => failedRequests.push(request.url()));
      await page.goto(`${base}/__lesson-result`);
      await page.evaluate((s) => {
        document.documentElement.dataset.scheme = s;
      }, scheme);
      await page.evaluate(() => document.fonts.ready);
      const fixture = page.getByTestId("lesson-result-fixture");
      const viewer = fixture.getByRole("region", {
        name: "Explanation of your captured result",
        exact: true,
      });
      await expect(viewer).toBeVisible({ timeout: 30000 });
      const value = (label: string) =>
        viewer.getByText(label, { exact: true }).locator("..").locator("dd");
      const sensor = viewer.getByRole("combobox", {
        name: "Sensor",
        exact: true,
      });
      const moment = viewer.getByRole("combobox", {
        name: "Selected moment",
        exact: true,
      });
      const source = viewer.getByRole("list", {
        name: "Supplied recording in flat order",
      });
      const chart = viewer.getByRole("group", { name: "Choose a series" });
      const noOverflow = async () => {
        try {
          await expect
            .poll(() =>
              page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
              ),
            )
            .toBe(true);
        } catch (error) {
          const overflow = await page.evaluate(() => ({
            viewport: innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            elements: [...document.querySelectorAll("body *")]
              .map((element) => {
                const rect = element.getBoundingClientRect();
                return {
                  tag: element.tagName,
                  classes: element.getAttribute("class"),
                  label: element.getAttribute("aria-label"),
                  x: rect.x,
                  right: rect.right,
                  width: rect.width,
                };
              })
              .filter(
                (element) =>
                  element.width > 0 && element.right > innerWidth + 1,
              )
              .slice(0, 30),
          }));
          await testInfo.attach("horizontal-overflow.json", {
            body: JSON.stringify(overflow, null, 2),
            contentType: "application/json",
          });
          throw error;
        }
      };
      const axeCounts: number[] = [];
      const accessibility = async () => {
        await viewer.evaluate((element) =>
          element.setAttribute("data-browser-result", "true"),
        );
        const results = await new AxeBuilder({ page })
          .include("[data-browser-result]")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        axeCounts.push(results.violations.length);
        writeFileSync(
          testInfo.outputPath(`axe-state-${axeCounts.length}.json`),
          JSON.stringify(results.violations, null, 2),
        );
        expect(results.violations).toEqual([]);
      };

      // The chart is artifact 1, after a text artifact, and must still link.
      await sensor.selectOption("3");
      await expect(value("Index in supplied flat list")).toHaveText("3");
      await expect(value("Value in captured chart")).toHaveText("8");
      await expect(
        chart.getByRole("button", { name: "Sensor D" }),
      ).toHaveAttribute("aria-pressed", "true");
      await moment.selectOption("1");
      await expect(value("Index in supplied flat list")).toHaveText("7");
      await expect(value("Value in captured chart")).toHaveText("8");
      const firstEight = source.getByRole("button", {
        name: /D at 1.*flat index 3/,
      });
      const secondEight = source.getByRole("button", {
        name: /D at 2.*flat index 7/,
      });
      await expect(firstEight).toHaveAttribute("aria-pressed", "false");
      await expect(secondEight).toHaveAttribute("aria-pressed", "true");
      await expect(viewer.locator("[data-exercise-series]")).toHaveCount(1);
      expect(await viewer.locator("circle title").allTextContents()).toEqual([
        "Sensor D, 1: 8",
        "Sensor D, 2: 8",
        "Sensor D, 3: 9",
      ]);

      // Keyboard activation of the chart updates the source inspector.
      await chart.getByRole("button", { name: "Sensor B" }).focus();
      await page.keyboard.press("Enter");
      await expect(sensor).toHaveValue("1");
      await expect(value("Index in supplied flat list")).toHaveText("5");
      await expect(value("Value in captured chart")).toHaveText("18");
      // Keyboard activation of the source updates the chart in return.
      await firstEight.focus();
      await page.keyboard.press("Enter");
      await expect(firstEight).toBeFocused();
      await expect(sensor).toHaveValue("3");
      await expect(moment).toHaveValue("0");
      await expect(value("Index in supplied flat list")).toHaveText("3");
      await expect(secondEight).toHaveAttribute("aria-pressed", "false");
      await chart.getByRole("button", { name: "All series" }).focus();
      await page.keyboard.press("Enter");
      await expect(viewer.locator("[data-exercise-series]")).toHaveCount(4);
      await secondEight.focus();
      await page.keyboard.press("Enter");
      await expect(viewer.locator("[data-exercise-series]")).toHaveCount(1);
      await expect(value("Index in supplied flat list")).toHaveText("7");
      await noOverflow();
      await accessibility();
      await viewer.screenshot({
        path: testInfo.outputPath(`linked-sensor-${width}-${scheme}.png`),
      });

      const scenario = fixture.getByRole("combobox", {
        name: "Fixture scenario",
      });
      await fixture
        .getByRole("checkbox", { name: "All checks passed" })
        .uncheck();
      await expect(viewer).toContainText("Some checks still need attention.");
      await scenario.selectOption("different");
      await expect(value("Value in supplied recording")).toHaveText("2");
      await expect(value("Value in captured chart")).toHaveText("902");
      await expect(viewer).toContainText(
        "It differs from the supplied reading.",
      );
      expect(await viewer.locator("circle title").allTextContents()).toContain(
        "Sensor A, 1: 902",
      );
      await fixture
        .getByRole("checkbox", { name: "Editor changed after capture" })
        .check();
      await expect(viewer).toContainText(
        "This explanation belongs to the submitted code.",
      );
      await expect(viewer).toContainText(
        "Your code has changed. Run it again to update these results.",
      );
      await expect(value("Value in captured chart")).toHaveText("902");
      await noOverflow();
      await viewer.screenshot({
        path: testInfo.outputPath(
          `partial-stale-different-${width}-${scheme}.png`,
        ),
      });
      await accessibility();

      await fixture
        .getByRole("checkbox", { name: "Editor changed after capture" })
        .uncheck();
      await scenario.selectOption("create");
      await expect(viewer).toContainText(
        "The supplied chart code groups the readings",
      );
      await expect(viewer).toContainText(
        "Compare the captured values with Demir’s recording.",
      );
      await scenario.selectOption("gradient");
      await expect(value("Captured automatic gradient")).toHaveText("0.32");
      await expect(value("Captured numerical estimate")).toHaveText("0.321");
      await expect(value("Automatic forward calculations")).toHaveText("1");
      await expect(value("Numerical forward calculations")).toHaveText("6");
      await viewer
        .getByRole("combobox", { name: "Variable", exact: true })
        .selectOption("1");
      await expect(value("Captured automatic gradient")).toHaveText("-1");
      await expect(value("Captured numerical estimate")).toHaveText("-0.999");
      await expect(value("Automatic forward calculations")).toHaveText("1");
      await expect(value("Numerical forward calculations")).toHaveText("6");
      await expect(viewer).toContainText(
        "Numerical estimation temporarily changes a variable and must restore it afterward.",
      );
      await expect(viewer).toContainText("Some checks still need attention.");
      await noOverflow();
      await accessibility();
      await viewer.screenshot({
        path: testInfo.outputPath(`gradient-counts-${width}-${scheme}.png`),
      });

      await scenario.selectOption("forward");
      const reading = viewer.getByRole("combobox", {
        name: "Reading",
        exact: true,
      });
      await reading.selectOption("1");
      const unit = viewer.getByRole("combobox", {
        name: "Output unit",
        exact: true,
      });
      await reading.focus();
      await page.keyboard.press("Tab");
      await expect(unit).toBeFocused();
      // This headless macOS Chromium also ignores selection keys on a plain
      // uncontrolled select. Use its native choice API after checking Tab access.
      await unit.selectOption("2");
      await expect(unit).toHaveValue("2");
      const terms = viewer.getByRole("list", {
        name: "Captured inputs and their contributions",
      });
      await expect(terms).toContainText(
        "Input 1: 3 times captured weight 2 gives 6",
      );
      await expect(terms).toContainText(
        "Input 2: 4 times captured weight -0.5 gives -2",
      );
      await expect(value("Captured bias")).toHaveText("-0.3");
      await expect(value("Sum of captured terms and bias")).toHaveText("3.7");
      await expect(value("Captured output")).toHaveText("3.7");
      await expect(value("Difference from that sum")).toHaveText("0");
      await noOverflow();
      await accessibility();
      await viewer.screenshot({
        path: testInfo.outputPath(`forward-trace-${width}-${scheme}.png`),
      });

      await scenario.selectOption("forward-different");
      await expect(value("Captured output")).toHaveText("902");
      await expect(value("Sum of captured terms and bias")).toHaveText("2.6");
      await expect(value("Difference from that sum")).toHaveText("899.4");
      await fixture
        .getByRole("checkbox", { name: "Editor changed after capture" })
        .check();
      await expect(viewer).toContainText(
        "This explanation belongs to the submitted code.",
      );
      await expect(value("Captured output")).toHaveText("902");
      await noOverflow();
      await accessibility();
      await viewer.screenshot({
        path: testInfo.outputPath(
          `forward-partial-stale-${width}-${scheme}.png`,
        ),
      });
      await fixture
        .getByRole("checkbox", { name: "Editor changed after capture" })
        .uncheck();
      await scenario.selectOption("loss");
      await expect(value("JavaScript batch reference")).toHaveText("0.15");
      const lossProbe = viewer.getByRole("combobox", {
        name: "Loss probe",
        exact: true,
      });
      await lossProbe.focus();
      await page.keyboard.press("Tab");
      await expect(
        viewer.getByRole("combobox", { name: "Batch position", exact: true }),
      ).toBeFocused();
      await lossProbe.selectOption("bce");
      await viewer
        .getByRole("combobox", { name: "Confidence case", exact: true })
        .selectOption("1");
      await expect(value("Captured logit")).toHaveText("-3");
      await expect(value("Your returned batch cross-entropy")).toHaveText(
        "3.048587",
      );
      await noOverflow();
      await accessibility();
      await viewer.screenshot({
        path: testInfo.outputPath(`loss-trace-${width}-${scheme}.png`),
        caret: "initial",
      });

      await scenario.selectOption("loss-wrong");
      await expect(
        viewer.getByRole("combobox", { name: "Loss probe", exact: true }),
      ).toHaveValue("mse");
      await viewer
        .getByRole("combobox", { name: "Loss probe", exact: true })
        .selectOption("bce");
      await viewer
        .getByRole("combobox", { name: "Confidence case", exact: true })
        .selectOption("1");
      await expect(value("Your returned batch cross-entropy")).toHaveText("0");
      await expect(value("JavaScript batch reference")).toHaveText("3.048587");
      await noOverflow();
      await accessibility();

      await scenario.selectOption("scalar");
      await viewer
        .getByRole("combobox", { name: "Captured update", exact: true })
        .selectOption("1");
      await expect(value("Weight before this update")).toHaveText("3.2");
      await expect(value("Your loss after this update")).toHaveText("6.5536");
      await noOverflow();
      await accessibility();
      await viewer.screenshot({
        path: testInfo.outputPath(`scalar-trace-${width}-${scheme}.png`),
        caret: "initial",
      });

      await scenario.selectOption("history");
      const epoch = viewer.getByRole("combobox", {
        name: "Captured sample epoch",
        exact: true,
      });
      await expect(epoch.locator("option")).toHaveCount(64);
      await epoch.selectOption("63");
      await expect(value("Recent ten-epoch window")).toHaveText("491 to 500");
      await expect(value("Captured validation loss")).toHaveText("1.2");
      await expect(value("Your returned diagnosis")).toHaveText(
        "train-down-validation-up",
      );
      await noOverflow();
      await accessibility();
      await viewer.screenshot({
        path: testInfo.outputPath(`history-trace-${width}-${scheme}.png`),
        caret: "initial",
      });

      await scenario.selectOption("history-short");
      await expect(value("Your returned diagnosis")).toHaveText(
        "insufficient-history",
      );
      await expect(viewer).toContainText(
        "A shorter requested training budget can still be valid.",
      );
      await noOverflow();
      await accessibility();

      await scenario.selectOption("history-threw");
      await expect(value("Diagnosis status")).toHaveText("threw");
      await expect(value("Your returned diagnosis")).toHaveText(
        "No valid label returned",
      );
      await expect(
        value("Reference from the captured full-window means"),
      ).toHaveText("train-down-validation-up");
      await noOverflow();
      await accessibility();
      for (const kind of [
        "policy",
        "inference",
        "capacity",
        "reports",
        "parity",
      ] as const) {
        await fixture
          .getByRole("checkbox", { name: "All checks passed" })
          .check();
        await scenario.selectOption(kind);
        if (kind === "policy") {
          await viewer
            .getByRole("combobox", { name: "Policy probe", exact: true })
            .selectOption("4");
          await expect(value("Reference from the stated policy")).toHaveText(
            "server",
          );
        } else if (kind === "inference") {
          await viewer
            .getByRole("combobox", { name: "Feature", exact: true })
            .selectOption("2");
          await expect(value("Observed value at model.predict")).toHaveText(
            "0.75",
          );
        } else if (kind === "capacity") {
          await viewer
            .getByRole("combobox", {
              name: "Projection calculation",
              exact: true,
            })
            .selectOption("4");
          await expect(value("Selected calculation reference")).toHaveText(
            "79",
          );
        } else if (kind === "reports") {
          await viewer
            .getByRole("combobox", { name: "Original report", exact: true })
            .selectOption("1");
          await expect(value("Your returned label")).toHaveText("NEG");
        } else {
          await viewer
            .getByRole("combobox", { name: "Input position", exact: true })
            .selectOption("2");
          await expect(value("Reference outputs agree")).toHaveText("true");
        }
        const control = viewer.getByRole("combobox").first();
        await control.focus();
        await expect(control).toBeFocused();
        await noOverflow();
        await accessibility();
        await viewer.screenshot({
          path: testInfo.outputPath(`${kind}-trace-${width}-${scheme}.png`),
          caret: "initial",
        });
        await scenario.selectOption(`${kind}-wrong`);
        await expect(viewer.getByRole("combobox").first()).toHaveValue("0");
        await fixture
          .getByRole("checkbox", { name: "All checks passed" })
          .uncheck();
        if (kind === "policy") {
          await expect(value("Your returned recommendation")).toHaveText(
            "server",
          );
          await expect(value("Reference from the stated policy")).toHaveText(
            "reconsider",
          );
        } else if (kind === "inference") {
          await expect(value("Your selected-class score")).toHaveText("0.25");
          await expect(value("Score from the stated class rule")).toHaveText(
            "0.75",
          );
        } else if (kind === "capacity") {
          await expect(value("Your returned hours to budget")).toHaveText(
            "902",
          );
        } else if (kind === "reports") {
          await viewer
            .getByRole("combobox", { name: "Original report", exact: true })
            .selectOption("1");
          await expect(value("Your returned label")).toHaveText("POS");
          await expect(value("Supplied sentiment label")).toHaveText("NEG");
        } else {
          await expect(value("Your returned outputsAgree")).toHaveText("false");
          await expect(value("Reference outputs agree")).toHaveText("true");
        }
        await fixture
          .getByRole("checkbox", { name: "Editor changed after capture" })
          .check();
        await expect(viewer).toContainText(
          "This explanation belongs to the submitted code.",
        );
        await noOverflow();
        await accessibility();
        await fixture
          .getByRole("checkbox", { name: "Editor changed after capture" })
          .uncheck();
      }
      for (const slug of [
        "compute-fft",
        "build-spectrogram",
        "pipeline-architecture",
        "write-model-card",
      ]) {
        await fixture
          .getByRole("combobox", { name: "Fixture scenario" })
          .selectOption(slug);
        await expect(viewer).toBeVisible();
        if (slug === "compute-fft")
          await expect(
            value("Returned frequency divided by bin spacing"),
          ).toHaveText("5");
        if (slug === "build-spectrogram") {
          await viewer
            .getByRole("combobox", { name: "Captured frame" })
            .selectOption("1");
          await expect(value("Captured raw magnitude at 40 Hz")).toHaveText(
            "32",
          );
        }
        if (slug === "pipeline-architecture") {
          await viewer
            .getByRole("combobox", { name: "FFT bin", exact: true })
            .selectOption("4");
          await expect(value("Captured magnitude")).toHaveText("8");
        }
        if (slug === "write-model-card") {
          await viewer
            .getByRole("combobox", { name: "Card line" })
            .selectOption("8");
          await expect(
            viewer.getByLabel("Selected captured card line"),
          ).toContainText("anomaly at 84.0%");
        }
        await noOverflow();
        await accessibility();
        await viewer.screenshot({
          path: testInfo.outputPath(`${slug}-captured-result.png`),
          caret: "initial",
        });
      }
      expect(errors).toEqual([]);
      expect(external).toEqual([]);
      expect(failedRequests).toEqual([]);
      const evidencePath = testInfo.outputPath("browser-evidence.json");
      writeFileSync(
        evidencePath,
        JSON.stringify(
          {
            width,
            scheme,
            localFonts,
            reducedMotion,
            source:
              "Predetermined typed captures. No learner code executes in this fixture.",
            scenarios: [
              "compute-fft",
              "build-spectrogram",
              "pipeline-architecture",
              "write-model-card",
              "arrange",
              "different-partial-stale",
              "create",
              "gradient",
              "forward",
              "forward-different-partial-stale",
              "loss",
              "loss-wrong",
              "scalar",
              "history",
              "history-short",
              "history-threw",
              "policy",
              "policy-wrong",
              "inference",
              "inference-wrong",
              "capacity",
              "capacity-wrong",
              "reports",
              "reports-wrong",
              "parity",
              "parity-wrong",
            ],
            axeViolations: axeCounts,
            externalRequests: external,
            failedRequests,
            pageErrors: errors,
          },
          null,
          2,
        ),
      );
      await testInfo.attach("browser-evidence", {
        path: evidencePath,
        contentType: "application/json",
      });
    });
  }
}
