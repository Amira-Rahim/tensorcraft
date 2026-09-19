// Compare two production builds using the same script, browser and route states.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const base = process.env.ASSET_BASE ?? "http://localhost:3118";
const label = process.env.ASSET_LABEL ?? "candidate";
const out = "docs/audits/learning-product-p7-2026-09-19";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const rows = [];
try {
  for (const [id, route, lesson] of [
    ["world", "/worlds/deep-orbit"],
    [
      "first-concept",
      "/worlds/deep-orbit/foundations/introduction-to-tensors",
      "introduction-to-tensors",
    ],
    [
      "normalization-concept",
      "/worlds/deep-orbit/foundations/normalization",
      "normalization",
    ],
  ]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: "dark",
      reducedMotion: "reduce",
    });
    await context.addInitScript((lesson) => {
      if (window.top !== window) return;
      localStorage.setItem("tc-cookie-consent", "declined");
      localStorage.setItem("tc-script-skip", "1");
      if (lesson) {
        localStorage.setItem(`tc_step_deep-orbit_${lesson}`, "1");
        localStorage.setItem(`tc_step_max_deep-orbit_${lesson}`, "1");
      }
    }, lesson);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    if (lesson) await page.waitForFunction(() => location.hash === "#step-2");
    const result = await page.evaluate(() => {
      const resources = performance.getEntriesByType("resource").map((r) => ({
        path: new URL(r.name).pathname,
        type: r.initiatorType,
        encodedBytes: r.encodedBodySize,
        decodedBytes: r.decodedBodySize,
      }));
      const total = (predicate) =>
        resources.filter(predicate).reduce((n, r) => n + r.encodedBytes, 0);
      return {
        resources,
        jsBytes: total((r) => /\.js$/.test(r.path)),
        cssBytes: total((r) => /\.css$/.test(r.path)),
        totalResourceBytes: total(() => true),
        modelRequests: resources.filter((r) =>
          /\/models\/|weights\.bin|\.onnx$/.test(r.path),
        ).length,
      };
    });
    rows.push({ id, route, ...result, errors });
    await context.close();
  }
} finally {
  await browser.close();
}
writeFileSync(
  `${out}/assets-${label}.json`,
  JSON.stringify(
    {
      label,
      base,
      browser: browser.version(),
      environment:
        "Local Next production build, cold browser context per route, 1440 dark, reduced motion, consent declined. Encoded response bodies exclude headers; no network throttling. Not a user-speed benchmark.",
      rows,
    },
    null,
    2,
  ) + "\n",
);
for (const row of rows)
  console.log(
    row.id,
    `JS=${row.jsBytes}`,
    `CSS=${row.cssBytes}`,
    `models=${row.modelRequests}`,
    `errors=${row.errors.length}`,
  );
if (rows.some((r) => r.errors.length || r.modelRequests)) process.exitCode = 1;
