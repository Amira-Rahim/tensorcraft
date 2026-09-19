// Production components/CSS with explicit auth and persistence boundaries.
// SQL isolation and merge semantics are tested separately in real PostgreSQL.
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("..", import.meta.url)),
  webRequire = createRequire(
    new URL("../apps/web/package.json", import.meta.url),
  );
const tailwind = (await import(webRequire.resolve("@tailwindcss/postcss")))
  .default;
const authStub = `
window.fixtureUser='account-a';window.fixtureListeners=new Set();window.fixtureWrites=[];window.fixtureOffline=false;
window.switchAccount=id=>{window.fixtureUser=id;for(const cb of window.fixtureListeners)cb('SIGNED_IN',id?{user:{id}}:null);};
export const getSupabaseBrowserClient=()=>({auth:{onAuthStateChange(cb){window.fixtureListeners.add(cb);return{data:{subscription:{unsubscribe(){window.fixtureListeners.delete(cb)}}}};}}});`;
const clientStub = `export async function saveActivity(userId,record){
  window.fixtureWrites.push({userId,record});
  if(window.fixtureOffline)throw new Error('Offline fixture: retry when connected.');
  if(userId!==window.fixtureUser)throw new Error('Account changed');
}
export async function readActivities(userId){if(userId!==window.fixtureUser)throw new Error('Account changed');return [];}`;
const html = `<!doctype html><html lang="en" data-world="deep-orbit" data-scheme="dark"><head><title>System evidence verification</title></head><body><main style="max-width:64rem;margin:2rem auto;padding:0 1rem"><h1>System evidence</h1><div id="root"></div></main><script type="module">
import React from 'react';import{createRoot}from'react-dom/client';
import{SystemEvidence}from'/apps/web/app/components/system-evidence.tsx';
import{LearningActivityScope}from'/apps/web/app/components/learning-activity-scope.tsx';
import{LearningExperiment}from'/apps/web/app/components/mdx/learning-experiment.tsx';
import{ProjectRunRecord}from'/apps/web/app/components/mdx/project-run-record.tsx';
import{buildSystemEvidence}from'/apps/web/lib/system-evidence.ts';
import'/packages/worlds/src/css/worlds.css';import'/apps/web/app/globals.css';
const lessons=[{slug:'normalization',moduleId:'foundations',title:'Normalization'},{slug:'threshold-tuning',moduleId:'anomaly-detection',title:'Threshold'},{slug:'launch',moduleId:'capstone',title:'Launch'}];
const activities=[{activity_id:'deep-orbit-normalization',content_version:1,phase:'changed_case',first_correct:false,first_assisted:false,latest_correct:true,latest_assisted:true,attempt_count:3,assistance_observed:true,completed_at:null,source:'browser_check',updated_at:'2026-09-19'}];
const stages=buildSystemEvidence({lessons,activities,progress:[{world_id:'deep-orbit',lesson_id:'normalization',status:'completed'}],attempts:[{world_id:'deep-orbit',lesson_id:'normalization',score:100,hints_used:0,attempted_at:'2026-09-19'}],reviews:[{lesson_id:'threshold-tuning',next_review_at:'2026-09-18'}],now:new Date('2026-09-19')});
createRoot(document.querySelector('#root')).render(React.createElement(React.Fragment,null,
React.createElement(SystemEvidence,{userId:'account-a',stages,unavailable:false}),
React.createElement(LearningActivityScope,{userId:'account-a'},React.createElement(LearningExperiment,{id:'normalization'}),React.createElement(ProjectRunRecord))));
</script></body></html>`;
const stubs = {
  "@/lib/supabase/client": authStub,
  "@/lib/learning-activity-client": clientStub,
  "next/navigation":
    "export const useRouter=()=>({refresh(){window.fixtureRefreshed=true;}});",
  "next/link":
    "import React from'react';export default function({children,...props}){return React.createElement('a',props,children);}",
  "@/lib/analytics-events": "export const EVENTS={};export const track=()=>{};",
};
const server = await createServer({
  root,
  cacheDir: path.join(root, "node_modules/.vite/check-system-evidence-browser"),
  configFile: false,
  publicDir: path.join(root, "apps/web/public"),
  server: { host: "127.0.0.1", port: 0 },
  resolve: {
    alias: {
      react: path.join(root, "packages/ui/node_modules/react"),
      "react-dom": path.join(root, "packages/ui/node_modules/react-dom"),
      "@tensorcraft/shared": path.join(root, "packages/shared/src"),
      "@": path.join(root, "apps/web"),
    },
  },
  css: { postcss: { plugins: [tailwind()] } },
  plugins: [
    {
      name: "system-boundaries",
      enforce: "pre",
      resolveId(id) {
        const prefix = path.join(root, "apps/web") + "/";
        const key = id.startsWith(prefix) ? "@/" + id.slice(prefix.length) : id;
        if (stubs[key]) return "\0" + key;
      },
      load(id) {
        if (id[0] === "\0") return stubs[id.slice(1)];
      },
      configureServer(s) {
        s.middlewares.use("/__system", async (_q, r, next) => {
          try {
            r.setHeader("Content-Type", "text/html");
            r.end(await s.transformIndexHtml("/__system", html));
          } catch (e) {
            next(e);
          }
        });
      },
    },
    react(),
  ],
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch();
  const evidence = path.join(
    root,
    "docs/audits/learning-product-p5-2026-09-19",
  );
  mkdirSync(evidence, { recursive: true });
  const results = [];
  for (const [width, scheme] of [
    [1440, "dark"],
    [390, "light"],
    [320, "dark"],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
      colorScheme: scheme,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(
      `http://127.0.0.1:${server.httpServer.address().port}/__system`,
    );
    await page.evaluate(
      (s) => (document.documentElement.dataset.scheme = s),
      scheme,
    );
    const dashboard = page.getByRole("region", {
      name: "Your DEEP SCAN system",
    });
    await dashboard.locator("summary").filter({ hasText: /^Data/ }).click();
    await expect(dashboard).toContainText("Changed case passed with help");
    await dashboard
      .locator("summary")
      .filter({ hasText: /^Evaluation/ })
      .click();
    await expect(
      dashboard.getByRole("link", { name: "Review due: Threshold" }).first(),
    ).toHaveAttribute("href", /\#step-1$/);
    const box = page.getByTestId("experiment-normalization");
    await page.evaluate(() => (window.fixtureOffline = true));
    await box.getByRole("textbox").fill("99,99");
    await box
      .getByRole("button", { name: "Check prediction", exact: true })
      .click();
    await expect(
      box.getByRole("button", { name: "Retry account sync" }),
    ).toBeVisible();
    await page.evaluate(() => (window.fixtureOffline = false));
    await box.getByRole("button", { name: "Retry account sync" }).click();
    await expect(
      box.getByText("Account summary saved.", { exact: true }),
    ).toBeVisible();
    const calls = await page.evaluate(() =>
      window.fixtureWrites.filter(
        (w) => w.record.activityId === "deep-orbit-normalization",
      ),
    );
    expect(calls.at(-1)).toEqual(calls[0]);
    const project = page.getByRole("region", {
      name: "Record your external run",
    });
    await project.getByLabel("Baseline result").fill("0.95");
    await project.getByLabel("Model result").fill("0.7");
    await project.getByLabel("Final-test row count").fill("200");
    await project
      .getByLabel(/Why this split/)
      .fill(
        "Later timestamps held out. Only training rows fitted the scaler. Fixture report.",
      );
    await project
      .getByLabel(/What did you observe/)
      .fill(
        "UI fixture: reload parity checked separately. This report tests recording, not a learner run.",
      );
    await project.getByLabel(/Help beyond/).selectOption("used");
    await project.getByRole("checkbox").check();
    await project
      .getByRole("button", { name: "Record external run", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(
      project.getByText(/does not award an independent project pass/),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.fixtureWrites.some(
            (w) => w.record.activityId === "room-project-run",
          ),
        ),
      )
      .toBe(true);
    const downloadPromise = page.waitForEvent("download");
    await project.getByRole("button", { name: "Download this record" }).click();
    const payload = JSON.parse(
      readFileSync(await (await downloadPromise).path(), "utf8"),
    );
    expect(payload.model).toBe("0.7");
    expect(payload.record.first.assisted).toBe(true);
    expect(
      JSON.stringify(await page.evaluate(() => window.fixtureWrites)),
    ).not.toContain("Later timestamps");
    const axe = await new AxeBuilder({ page }).include("#root").analyze();
    expect(axe.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await dashboard.screenshot({
      path: path.join(evidence, `system-${width}-${scheme}.png`),
    });
    await project.screenshot({
      path: path.join(evidence, `project-${width}-${scheme}.png`),
    });
    await page.evaluate(() => window.switchAccount("account-b"));
    await expect(box.getByRole("textbox")).toHaveValue("");
    await expect(project.getByLabel("Model result")).toHaveValue("");
    await expect(page.getByText(/Account changed/)).toBeVisible();
    await expect(dashboard).toHaveCount(0);
    await page.evaluate(() => window.switchAccount("account-a"));
    await expect(box.getByRole("textbox")).toHaveValue("99,99");
    await expect(project.getByLabel("Model result")).toHaveValue("0.7");
    expect(errors).toEqual([]);
    results.push({
      width,
      scheme,
      accountSwitch: true,
      failedSaveRetry: true,
      projectReportAndDownload: true,
      scopedAxe: true,
    });
    await context.close();
  }
  writeFileSync(
    path.join(evidence, "browser-results.json"),
    JSON.stringify(
      {
        scope:
          "Production components and CSS; explicit auth/persistence stubs. Synthetic report values are UI fixtures, not learning or project-performance evidence.",
        results,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "System evidence, project report/download, account boundaries and failed-save retry passed at three widths.",
  );
} finally {
  await browser?.close();
  await server.close();
}
