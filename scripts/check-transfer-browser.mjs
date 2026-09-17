// Local component verification with production React code, CSS and public assets.
// This does not bypass or verify the paid lesson's authentication/navigation.
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { chromium, expect } from "@playwright/test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("..", import.meta.url));
const webRequire = createRequire(
  new URL("../apps/web/package.json", import.meta.url),
);
const tailwind = (await import(webRequire.resolve("@tailwindcss/postcss")))
  .default;
const html = `<!doctype html><html lang="en" data-world="deep-orbit" data-theme="dark"><head><title>Transfer assignment check</title></head><body><main style="max-width:42rem;margin:2rem auto;padding:0 1rem"><div id="root" class="lesson-prose lesson-step-content" data-show-prose="false" data-show-challenge="true"></div></main><script type="module">
import React from 'react';
import { createRoot } from 'react-dom/client';
import { TransferAssignment } from '/apps/web/app/components/mdx/transfer-assignment.tsx';
import '/packages/worlds/src/css/worlds.css';
import '/apps/web/app/globals.css';
createRoot(document.getElementById('root')).render(React.createElement(TransferAssignment));
</script></body></html>`;
const server = await createServer({
  root,
  configFile: false,
  publicDir: path.join(root, "apps/web/public"),
  server: { host: "127.0.0.1", port: 0 },
  resolve: {
    alias: {
      react: path.join(root, "packages/ui/node_modules/react"),
      "react-dom": path.join(root, "packages/ui/node_modules/react-dom"),
      "@tensorcraft/worlds": path.join(root, "packages/worlds/src"),
    },
  },
  css: { postcss: { plugins: [tailwind()] } },
  plugins: [
    react(),
    {
      name: "transfer-check-page",
      configureServer(instance) {
        instance.middlewares.use(
          "/__transfer-check",
          async (_req, res, next) => {
            try {
              res.setHeader("Content-Type", "text/html");
              res.end(
                await instance.transformIndexHtml("/__transfer-check", html),
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
let browser;
try {
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1100, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/__transfer-check`);
  await expect(
    page.getByRole("heading", {
      name: "Independent assignment: build failure triage",
    }),
  ).toBeVisible();
  await expect(page.getByText(/Draft saved in this tab/)).toBeVisible();
  await page
    .getByLabel("Decision and error costs")
    .fill("Review likely build failures. Avoid needless interruptions.");
  await page
    .getByRole("button", { name: "I need help with the split" })
    .click();
  await page.reload();
  await expect(page.getByLabel("Decision and error costs")).toHaveValue(
    "Review likely build failures. Avoid needless interruptions.",
  );
  await expect(
    page.getByRole("button", { name: "I need help with the split" }),
  ).toHaveAttribute("aria-expanded", "true");
  const reportDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download report" }).click();
  const report = await reportDownload;
  const reportPath = await report.path();
  const json = JSON.parse(readFileSync(reportPath, "utf8"));
  expect(json.openedRescues).toEqual(["split"]);
  expect(json.selfReviewedAt).toBeNull();
  await page.getByLabel("Decision and error costs").fill("Unsaved replacement");
  await page.getByLabel(/Load a saved report/).setInputFiles(reportPath);
  await expect(page.getByLabel("Decision and error costs")).toHaveValue(
    json.answers.decision,
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("link", { name: "Download assignment", exact: true })
    .click();
  const bundle = await download;
  expect(
    readFileSync(await bundle.path()).equals(
      readFileSync(
        path.join(root, "apps/web/public/assignments/build-triage-v1.zip"),
      ),
    ),
  ).toBe(true);
  for (const width of [1100, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({
      path: `/tmp/tensorcraft-transfer-${width}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
  console.log(
    "Browser check passed: render, tab restore, hint record, report download/import, assignment download, desktop/mobile overflow.",
  );
} finally {
  await browser?.close();
  await server.close();
}
