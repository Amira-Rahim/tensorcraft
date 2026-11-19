import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createServer, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type {} from "./fixtures/evaluation-evidence";

test.describe.configure({ mode: "default" });

// Production components and CSS on a loopback-only server. No paid route,
// authentication service, or remote asset is involved in this fixture.
const root = process.cwd();
const webRequire = createRequire(path.join(root, "apps/web/package.json"));
const contentRequire = createRequire(
  path.join(root, "packages/content/package.json"),
);
const { parse } = createRequire(contentRequire.resolve("velite"))("yaml");
const exercisePaths = {
  "deep-scan-eval": "training-loop/exercises/deep-scan-eval.yaml",
  "normalize-data": "foundations/exercises/normalize-data.yaml",
  "simple-network": "neural-networks/exercises/simple-network.yaml",
};
const content = new Map(
  Object.entries(exercisePaths).map(([slug, location]) => [
    slug,
    parse(
      readFileSync(
        path.join(root, "packages/content/content/deep-orbit", location),
        "utf8",
      ),
    ),
  ]),
);
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
      const css = readFileSync(path.join(chunks, file), "utf8");
      const faces = css.match(/@font-face\s*\{[^}]*\}/g) ?? [];
      fontCss += faces
        .join("\n")
        .replace(/\.\.\/media\/([^"')]+)/g, (_match, name: string) => {
          const location = path.join(
            root,
            "apps/web/.next/dev/static/media",
            name,
          );
          if (existsSync(location)) media.set(name, location);
          return `/__evaluation-fonts/${name}`;
        });
    }
    localFonts =
      fontCss.includes("font-family: Inter;") &&
      fontCss.includes("font-family: JetBrains Mono;");
  }
  const html = `<!doctype html><html lang="en" data-world="deep-orbit" data-scheme="dark" style="--font-inter:Inter;--font-jetbrains-mono:'JetBrains Mono'"><head><title>Evaluation browser verification</title><style>${fontCss}</style></head><body><div id="root"></div><script type="module" src="/e2e/fixtures/evaluation-evidence.tsx"></script></body></html>`;
  server = await createServer({
    root,
    configFile: false,
    cacheDir: path.join(root, "node_modules/.vite/evaluation-result-browser"),
    publicDir: path.join(root, "apps/web/public"),
    optimizeDeps: { entries: ["e2e/fixtures/evaluation-evidence.tsx"] },
    server: { host: "127.0.0.1", port: 0, hmr: false },
    define: { "process.env.NEXT_PUBLIC_EVALUATION_SAVES_ENABLED": '"true"' },
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
        name: "local-evaluation-fixture",
        configureServer(instance) {
          instance.middlewares.use(
            "/__evaluation-content",
            (request, response) => {
              const slug =
                new URL(
                  request.url ?? "/",
                  "http://fixture.local",
                ).searchParams.get("exercise") ?? "deep-scan-eval";
              const exercise = content.get(slug);
              if (!exercise) {
                response.statusCode = 404;
                response.end();
                return;
              }
              response.setHeader("Content-Type", "application/json");
              response.end(JSON.stringify(exercise));
            },
          );
          instance.middlewares.use(
            "/__evaluation-fonts",
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
            "/__evaluation",
            async (_request, response, next) => {
              try {
                response.setHeader("Content-Type", "text/html");
                response.end(
                  await instance.transformIndexHtml("/__evaluation", html),
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
    throw new Error("No loopback fixture address");
  base = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await server?.close();
});

for (const width of [1440, 390, 320]) {
  for (const scheme of ["dark", "light"] as const) {
    test(`evaluation current and saved parity at ${width}px in ${scheme}`, async ({
      page,
      context,
    }, testInfo) => {
      test.setTimeout(120000);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
      const external: string[] = [],
        errors: string[] = [];
      await context.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (["blob:", "data:"].includes(url.protocol) || url.origin === base)
          return route.continue();
        external.push(url.origin);
        return route.abort();
      });
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${base}/__evaluation`);
      await page.evaluate((s) => {
        document.documentElement.dataset.scheme = s;
      }, scheme);
      await page.evaluate(() => document.fonts.ready);
      const fixture = page.getByTestId("evaluation-evidence-fixture");
      await expect(fixture.locator(".cm-content")).toBeVisible({
        timeout: 30000,
      });
      await fixture
        .getByRole("button", { name: "Show Solution", exact: true })
        .click();
      await fixture
        .getByRole("button", { name: "Run Tests", exact: true })
        .click();
      await expect(fixture.getByTestId("test-results-panel")).toContainText(
        "All tests passed!",
        { timeout: 60000 },
      );
      const current = fixture.getByRole("region", {
        name: "Result from this run",
        exact: true,
      });
      const viewer = current.getByRole("region", {
        name: "The cases behind this evaluation",
        exact: true,
      });
      await expect(viewer.locator("[data-case-id]")).toHaveCount(43);
      await expect(fixture.getByTestId("lesson-body-sample")).toHaveCSS(
        "font-size",
        "22px",
      );
      await expect(viewer.getByRole("status")).toHaveCSS("font-size", "14px");
      await expect(viewer.locator("p").first()).toHaveCSS("font-size", "16px");
      await expect(
        viewer.getByRole("heading", {
          name: "The cases behind this evaluation",
          exact: true,
        }),
      ).toHaveCSS("font-size", "20px");
      const selector = viewer.getByRole("combobox", {
        name: "Case to inspect",
      });
      // Headless Chromium on macOS does not drive its native select popup.
      // Select through the platform control API, then check the keyboard path
      // through both adjacent navigation buttons.
      await selector.selectOption("1");
      await selector.focus();
      await expect(selector).toHaveValue("1");
      await page.keyboard.press("Tab");
      await expect(
        viewer.getByRole("button", { name: "Previous case" }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(selector).toHaveValue("0");
      await page.keyboard.press("Tab");
      await expect(
        viewer.getByRole("button", { name: "Next case" }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(selector).toHaveValue("1");
      await viewer
        .getByRole("button", { name: "Missed anomalies", exact: true })
        .click();
      await expect(viewer.locator("[data-case-id]")).toHaveCount(43);
      await viewer
        .getByRole("button", { name: "All cases", exact: true })
        .click();
      await selector.selectOption("40");
      const points = await viewer
        .locator("[data-case-id]")
        .evaluateAll((nodes) =>
          nodes.map((node) => ({
            id: node.getAttribute("data-case-id"),
            score: node.getAttribute("data-score"),
            source: node.getAttribute("data-source"),
          })),
        );
      const selectedText = await viewer
        .getByRole("region", { name: "Case 40", exact: true })
        .innerText();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        )
        .toBe(true);
      await viewer.evaluate((element) =>
        element.setAttribute("data-evaluation-browser-current", "true"),
      );
      const axe = await new AxeBuilder({ page })
        .include("[data-evaluation-browser-current]")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(axe.violations).toEqual([]);
      await viewer.screenshot({
        path: testInfo.outputPath(`evaluation-current-${width}-${scheme}.png`),
      });
      const history = fixture.getByRole("region", {
        name: "Saved evaluation runs",
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
        .filter({ hasText: /^Saved run:/ })
        .click();
      await expect(history).toContainText(
        "This run has an inspection view above",
      );
      await expect(
        history.getByRole("combobox", { name: "Case to inspect" }),
      ).toHaveCount(0);
      await history
        .getByRole("button", { name: "Inspect this run above", exact: true })
        .click();
      await expect(current).toBeFocused();
      const records = await page.evaluate(() =>
        window.tcEvaluationEvidenceFixture.records(),
      );
      expect(records).toHaveLength(1);
      expect(records[0].exerciseSlug).toBe("deep-scan-eval");
      expect(records[0].runtimeVersion).toBe("4.22.0");
      expect(records[0].backend).toBe("cpu");
      await fixture
        .getByRole("button", { name: "Restore My Code", exact: true })
        .click();
      const editor = fixture.locator(".cm-content");
      await editor.click();
      await page.keyboard.press(
        process.platform === "darwin" ? "Meta+a" : "Control+a",
      );
      await page.keyboard.insertText(
        "throw new Error('Evaluation retry failed');",
      );
      await fixture
        .getByRole("button", { name: "Run Tests", exact: true })
        .click();
      await expect(fixture.getByTestId("test-results-panel")).toContainText(
        "Evaluation retry failed",
      );
      const previous = fixture.locator("details").filter({
        has: page.locator("summary").filter({ hasText: /^Previous run$/ }),
      });
      await expect(previous).not.toHaveAttribute("open");
      await history
        .getByRole("button", { name: "Inspect this run above", exact: true })
        .click();
      await expect(previous).toHaveAttribute("open");
      await expect(previous).toBeFocused();
      await expect(previous.locator("[data-case-id]")).toHaveCount(43);
      await expect(current.locator("[data-case-id]")).toHaveCount(0);
      await expect(history.locator("[data-case-id]")).toHaveCount(0);
      await page.reload();
      await page.evaluate((s) => {
        document.documentElement.dataset.scheme = s;
      }, scheme);
      await expect(fixture.locator(".cm-content")).toBeVisible({
        timeout: 30000,
      });
      await history
        .locator("summary")
        .filter({ hasText: /^Saved run:/ })
        .click();
      const saved = history.getByRole("region", {
        name: "The cases behind this evaluation",
        exact: true,
      });
      await expect(saved.locator("[data-case-id]")).toHaveCount(43);
      expect(
        await saved.locator("[data-case-id]").evaluateAll((nodes) =>
          nodes.map((node) => ({
            id: node.getAttribute("data-case-id"),
            score: node.getAttribute("data-score"),
            source: node.getAttribute("data-source"),
          })),
        ),
      ).toEqual(points);
      await saved
        .getByRole("combobox", { name: "Case to inspect" })
        .selectOption("40");
      expect(
        await saved
          .getByRole("region", { name: "Case 40", exact: true })
          .innerText(),
      ).toBe(selectedText);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        )
        .toBe(true);
      await saved.screenshot({
        path: testInfo.outputPath(`evaluation-saved-${width}-${scheme}.png`),
      });
      expect(errors).toEqual([]);
      expect(external).toEqual([]);
      const evidence = JSON.stringify(
        {
          width,
          scheme,
          localFonts,
          runtime: records[0].runtimeVersion,
          backend: records[0].backend,
          cases: points.length,
          axeViolations: axe.violations.length,
          externalRequests: external,
          pageErrors: errors,
        },
        null,
        2,
      );
      const evidencePath = testInfo.outputPath("browser-evidence.json");
      writeFileSync(evidencePath, evidence);
      await testInfo.attach("browser-evidence", {
        path: evidencePath,
        contentType: "application/json",
      });
    });
  }
}

for (const lesson of [
  {
    slug: "normalize-data",
    title: "A reading from this run",
    history: "Saved normalization runs",
    selector: "Reading",
    value: "2",
  },
  {
    slug: "simple-network",
    title: "Your model before and after training",
    history: "Saved network runs",
    selector: "Training row",
    value: "8",
  },
]) {
  test(`${lesson.slug} current and saved inspection at 390px`, async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
    const external: string[] = [],
      errors: string[] = [];
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (["blob:", "data:"].includes(url.protocol) || url.origin === base)
        return route.continue();
      external.push(url.origin);
      return route.abort();
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/__evaluation?exercise=${lesson.slug}`);
    const fixture = page.getByTestId("evaluation-evidence-fixture");
    await expect(fixture.locator(".cm-content")).toBeVisible({
      timeout: 30000,
    });
    await fixture
      .getByRole("button", { name: "Show Solution", exact: true })
      .click();
    await fixture
      .getByRole("button", { name: "Run Tests", exact: true })
      .click();
    await expect(fixture.getByTestId("test-results-panel")).toContainText(
      "All tests passed!",
      { timeout: 60000 },
    );
    const current = fixture.getByRole("region", {
      name: "Result from this run",
      exact: true,
    });
    const viewer = current.getByRole("region", {
      name: lesson.title,
      exact: true,
    });
    await viewer
      .getByRole("combobox", { name: lesson.selector, exact: true })
      .selectOption(lesson.value);
    const displayed = await viewer.innerText();
    await viewer.evaluate((element) =>
      element.setAttribute("data-browser-smoke", "true"),
    );
    const axe = await new AxeBuilder({ page })
      .include("[data-browser-smoke]")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(axe.violations).toEqual([]);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      )
      .toBe(true);
    await viewer.screenshot({
      path: testInfo.outputPath(`${lesson.slug}-current-390-dark.png`),
    });
    const history = fixture.getByRole("region", {
      name: lesson.history,
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
      .filter({ hasText: /^Saved run:/ })
      .click();
    await expect(history.getByRole("combobox")).toHaveCount(0);
    await history
      .getByRole("button", { name: "Inspect this run above", exact: true })
      .click();
    await expect(current).toBeFocused();
    const records = await page.evaluate(() =>
      window.tcEvaluationEvidenceFixture.records(),
    );
    expect(records).toHaveLength(1);
    expect(records[0].exerciseSlug).toBe(lesson.slug);
    expect(records[0].runtimeVersion).toBe("4.22.0");
    expect(records[0].backend).toBe("cpu");
    await page.reload();
    await expect(fixture.locator(".cm-content")).toBeVisible({
      timeout: 30000,
    });
    await history
      .locator("summary")
      .filter({ hasText: /^Saved run:/ })
      .click();
    const saved = history.getByRole("region", {
      name: lesson.title,
      exact: true,
    });
    await saved
      .getByRole("combobox", { name: lesson.selector, exact: true })
      .selectOption(lesson.value);
    expect(await saved.innerText()).toBe(displayed);
    expect(
      await page.evaluate(() => window.tcEvaluationEvidenceFixture.records()),
    ).toEqual(records);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      )
      .toBe(true);
    await saved.screenshot({
      path: testInfo.outputPath(`${lesson.slug}-saved-390-dark.png`),
    });
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
    const evidencePath = testInfo.outputPath("browser-evidence.json");
    writeFileSync(
      evidencePath,
      JSON.stringify(
        {
          exercise: lesson.slug,
          width: 390,
          scheme: "dark",
          localFonts,
          runtime: records[0].runtimeVersion,
          backend: records[0].backend,
          axeViolations: axe.violations.length,
          externalRequests: external,
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
