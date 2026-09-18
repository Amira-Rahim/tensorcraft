// Local component verification with production React code, CSS and public assets.
// This does not bypass or verify the paid lesson's authentication/navigation.
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { chromium, expect } from "@playwright/test";
import { createRequire } from "node:module";
import {
  readFileSync,
  writeFileSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
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
import { DecisionTask } from '/apps/web/app/components/mdx/decision-task.tsx';
import { IndependentProject } from '/apps/web/app/components/mdx/independent-project.tsx';
import '/packages/worlds/src/css/worlds.css';
import '/apps/web/app/globals.css';
createRoot(document.getElementById('root')).render(React.createElement(React.Fragment, null, React.createElement(DecisionTask, {id:'review-costs'}), React.createElement(IndependentProject)));
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
      "@tensorcraft/shared": path.join(root, "packages/shared/src"),
      "@/lib/project-export": path.join(root, "apps/web/lib/project-export.ts"),
    },
  },
  css: { postcss: { plugins: [tailwind()] } },
  plugins: [
    react(),
    {
      name: "transfer-check-page",
      // Explicit API boundary stub; production component and folder reader run unchanged.
      resolveId(id) {
        if (id === "@/lib/api-fetch") return "\0project-api";
      },
      load(id) {
        if (id === "\0project-api")
          return "export const apiFetch = (path, options) => fetch(path, options);";
      },
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
let uploadFolder;
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
    page.getByRole("heading", { name: "Decision: choose a review policy" }),
  ).toBeVisible();
  await expect(page.getByText(/Costs are 80 minutes/)).toHaveCount(0);
  await page.getByLabel("Never flag a build").check();
  await page
    .getByLabel("Total error cost of your chosen policy (minutes)")
    .fill("80");
  await page
    .getByLabel("Your reasoning")
    .fill("No false alarms cost time, but ten failures would be missed.");
  await page.getByLabel("Help used, or None").fill("None");
  await page.getByLabel("Minutes spent (your estimate)").fill("3");
  await page
    .getByRole("button", { name: "Submit decision and show feedback" })
    .click();
  await expect(page.getByText(/Recheck the stated constraints/)).toBeVisible();
  await page.getByLabel("Use the model", { exact: true }).check();
  await page
    .getByLabel("Total error cost of your chosen policy (minutes)")
    .fill("28");
  await page
    .getByRole("button", { name: "Submit decision and show feedback" })
    .click();
  await page.reload();
  await expect(page.getByText(/Attempt 2:/)).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download decision record" }).click();
  const report = JSON.parse(
    readFileSync(await (await download).path(), "utf8"),
  );
  expect(report.attempts.map((a) => a.choice)).toEqual(["baseline", "model"]);
  const projectDownload = page.waitForEvent("download");
  await page
    .getByRole("link", { name: "Download independent project", exact: true })
    .click();
  const bundle = await projectDownload;
  expect(
    readFileSync(await bundle.path()).equals(
      readFileSync(
        path.join(root, "apps/web/public/assignments/room-occupancy-v1.zip"),
      ),
    ),
  ).toBe(true);
  // If supplied, use a genuinely trained standalone fixture, never learner records.
  const projectArg = process.argv.indexOf("--project");
  if (projectArg !== -1) {
    const source = path.resolve(process.argv[projectArg + 1]);
    uploadFolder = mkdtempSync(
      path.join(tmpdir(), "tensorcraft-export-browser-"),
    );
    for (const entry of readdirSync(source, { withFileTypes: true })) {
      if (entry.isFile())
        copyFileSync(
          path.join(source, entry.name),
          path.join(uploadFolder, entry.name),
        );
      else if (["model", "runs"].includes(entry.name)) {
        mkdirSync(path.join(uploadFolder, entry.name));
        for (const name of readdirSync(path.join(source, entry.name)))
          copyFileSync(
            path.join(source, entry.name, name),
            path.join(uploadFolder, entry.name, name),
          );
      }
    }
    writeFileSync(
      path.join(uploadFolder, ".env"),
      "EXCLUDED_FIXTURE=not-a-secret",
    );
    mkdirSync(path.join(uploadFolder, "node_modules"));
    writeFileSync(
      path.join(uploadFolder, "node_modules/excluded.js"),
      "excluded fixture",
    );
    const requests = [];
    await page.route("**/api/github/project-export", (route) => {
      requests.push(route.request());
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          route.request().method() === "GET"
            ? {
                repositoryId: 17,
                fullName: "fixture/tensorcraft-deep-orbit",
                private: false,
                url: "https://github.com/fixture/tensorcraft-deep-orbit",
              }
            : {
                success: true,
                url: "https://github.com/fixture/tensorcraft-deep-orbit/tree/fixture/projects/snapshot",
              },
        ),
      });
    });
    await page
      .getByLabel("Completed project folder")
      .setInputFiles(uploadFolder);
    await expect(page.getByText(/2 other files excluded/)).toBeVisible();
    expect(requests).toHaveLength(0);
    await page
      .getByRole("button", { name: "Preview GitHub destination" })
      .click();
    await expect(page.getByText(/public; anyone can read/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Publish project snapshot" }),
    ).toBeDisabled();
    await page.getByRole("checkbox").check();
    await page
      .getByRole("button", { name: "Publish project snapshot" })
      .click();
    await expect(page.getByText(/Project saved/)).toBeVisible();
    expect(requests.map((request) => request.method())).toEqual([
      "GET",
      "POST",
    ]);
    const payload = requests[1].postDataJSON();
    expect(
      payload.files.some(
        (file) => file.path === ".env" || file.path.startsWith("node_modules/"),
      ),
    ).toBe(false);
    for (const file of payload.files)
      expect(
        Buffer.from(file.base64, "base64").equals(
          readFileSync(path.join(source, file.path)),
        ),
      ).toBe(true);
    console.log(
      `Project folder browser check: ${payload.files.length} uploaded files match original bytes; preview/consent enforced; .env and dependencies excluded. API responses mocked.`,
    );
  }
  for (const width of [1100, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({
      path: `/tmp/tensorcraft-decisions-${width}.png`,
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
    "Browser check passed: decisions render, hidden feedback, submission, first-attempt retention, tab restore, record/project download, desktop/mobile overflow.",
  );
} finally {
  await browser?.close();
  await server.close();
  if (uploadFolder) rmSync(uploadFolder, { recursive: true, force: true });
}
