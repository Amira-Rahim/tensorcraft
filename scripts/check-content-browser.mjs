// Render every launched lesson with the production LessonContent component.
// Local fixture: authentication/analytics/API boundaries and the dynamic exercise
// editor are stubbed. Exercise execution is verified separately.
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { chromium, expect } from "@playwright/test";
import { createRequire } from "node:module";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("..", import.meta.url));
const requireWeb = createRequire(
  new URL("../apps/web/package.json", import.meta.url),
);
const tailwind = (await import(requireWeb.resolve("@tailwindcss/postcss")))
  .default;
const lessons = JSON.parse(
  readFileSync(
    path.join(root, "packages/content/.velite/lessons.json"),
    "utf8",
  ),
).filter((l) => l.worldId === "deep-orbit");
const html = `<!doctype html><html lang="en" data-world="deep-orbit" data-theme="dark"><head><title>Internal content review</title></head><body><main style="max-width:48rem;margin:2rem auto;padding:0 1rem"><h1 id="title"></h1><div id="root"></div></main><script type="module">
import React from 'react';import {createRoot} from 'react-dom/client';
import {LessonContent} from '/apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx';
import {GlossaryProvider} from '/apps/web/app/worlds/[slug]/[module]/[lesson]/glossary-context.tsx';
import '/packages/worlds/src/css/worlds.css';import '/apps/web/app/globals.css';
const lessons=await (await fetch('/__content-data')).json();const root=createRoot(document.getElementById('root'));
const visible=new Set(['prose','Dialogue','CodeBlock','DerivationDrawer','LearningObjectives','LessonRecap','RecallPrompt','BridgeCallout','Epilogue','BossBeat','StoryConsequence','DecisionTask','IndependentProject','TransferAssignment','DispatchTease','MathBlock','Concept']);
window.showLesson=(index,mode='all')=>{if(index<0){root.render(null);return;}const lesson=lessons[index];const active=mode==='consequence'?new Set(['Epilogue','DispatchTease']):mode==='briefing'?new Set(['BossBeat']):visible;document.querySelector('#title').textContent=lesson.title;root.render(React.createElement(GlossaryProvider,null,React.createElement(LessonContent,{key:index+mode,lesson,worldId:'deep-orbit',lessonId:lesson.slug,moduleId:lesson.moduleId,glossaryTerms:lesson.glossaryTerms,visibleComponents:active,showProse:mode==='all',showPostRecap:mode==='consequence'})));return lesson.slug;};window.lessonCount=lessons.length;window.showLesson(0);
</script></body></html>`;
const storyMode = process.argv.includes("--story");
const fixture = { choices: new Map(), failReads: 0, failWrites: 0 };
const stubs = {
  "next/dynamic": "export default function(){return ()=>null;}",
  "next/link":
    "import React from 'react';export default function({href,children,...props}){return React.createElement('a',{href,...props},children)}",
  "next/image":
    "import React from 'react';export default function({src,alt,fill,priority,unoptimized,...props}){return React.createElement('img',{src,alt,...props})}",
  "@/lib/analytics":
    "export const trackCheckpointSubmitted=()=>{},trackExerciseSubmitted=()=>{},trackHintRequested=()=>{},trackRecallAnswered=()=>{},trackRecallPromptAnswered=()=>{};",
  "@/lib/boss-beat-client":
    'export const getBossBeatChoice=async()=>null,recordBossBeatChoice=async()=>{throw new Error("Read-only rendering fixture")}; export const BOSS_BEAT_CHANGED="boss-beat-changed";',
  "@/lib/api-fetch":
    'export const apiFetch=async()=>new Response(JSON.stringify({choice:null,choices:[]}),{status:200,headers:{"Content-Type":"application/json"}});',
};
if (storyMode) delete stubs["@/lib/boss-beat-client"];
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
      "@tensorcraft/ui": path.join(root, "packages/ui/src"),
      "@": path.join(root, "apps/web"),
    },
  },
  css: { postcss: { plugins: [tailwind()] } },
  plugins: [
    {
      name: "review-boundaries",
      enforce: "pre",
      resolveId(id, importer) {
        if (
          storyMode &&
          id === "./supabase/client" &&
          importer?.endsWith("/boss-beat-client.ts")
        )
          return "\0story-supabase";
        const key = id.startsWith(root + "/apps/web/")
          ? "@/" + id.slice((root + "/apps/web/").length)
          : id;
        if (stubs[key]) return "\0review:" + key;
      },
      load(id) {
        if (id === "\0story-supabase")
          return `export const getSupabaseBrowserClient=()=>({auth:{getUser:async()=>({data:{user:{id:'story-fixture'}},error:null})},rpc:async(name,args)=>(await fetch('/__story-rpc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,args})})).json()});`;
        if (id.startsWith("\0review:")) return stubs[id.slice(8)];
      },
    },
    react(),
    {
      name: "review-page",
      configureServer(s) {
        s.middlewares.use("/__story-rpc", async (q, r) => {
          let body = "";
          for await (const chunk of q) body += chunk;
          const { name, args } = JSON.parse(body);
          const write = name === "record_boss_beat_choice";
          const failed = write
            ? fixture.failWrites-- > 0
            : fixture.failReads-- > 0;
          let data = null;
          if (!failed) {
            if (write) {
              data = !fixture.choices.has(args.p_beat_id);
              if (data)
                fixture.choices.set(args.p_beat_id, {
                  beat_id: args.p_beat_id,
                  choice_index: args.p_choice_index,
                  choice_label: args.p_choice_label,
                  reaction_ms: args.p_reaction_ms ?? null,
                  chosen_at: new Date().toISOString(),
                });
            } else {
              const row = fixture.choices.get(args.p_beat_id);
              data = row ? [row] : [];
            }
          }
          r.setHeader("Content-Type", "application/json");
          r.end(
            JSON.stringify({
              data,
              error: failed ? { message: "Injected fixture failure" } : null,
            }),
          );
        });
        s.middlewares.use("/__content-data", (_q, r) => {
          r.setHeader("Content-Type", "application/json");
          r.end(JSON.stringify(lessons));
        });
        s.middlewares.use("/__content-review", async (_q, r, next) => {
          try {
            r.setHeader("Content-Type", "text/html");
            r.end(await s.transformIndexHtml("/__content-review", html));
          } catch (e) {
            next(e);
          }
        });
      },
    },
  ],
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1100, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/__content-review`,
  );
  await page.waitForFunction(() => window.lessonCount === 56, {
    timeout: 60000,
  });
  mkdirSync("test-results/content-review", { recursive: true });
  const checked = [];
  if (storyMode)
    await (
      await import("./check-story-browser.mjs")
    ).runStoryChecks({ page, base, lessons, fixture, root });
  for (const width of [1100, 375]) {
    await page.setViewportSize({ width, height: 900 });
    for (let i = 0; i < lessons.length; i++) {
      await page.evaluate((i) => window.showLesson(i), i);
      await expect(page.locator("#title")).toHaveText(lessons[i].title);
      await expect(page.locator(".lesson-prose")).not.toContainText(
        "Error rendering",
      );
      await expect(page.locator('[data-testid="epilogue"]')).toBeVisible();
      await expect(page.locator(".lesson-prose")).toContainText("Challenge");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      if (overflow) {
        await page.screenshot({
          path: "test-results/content-review/overflow.png",
          fullPage: true,
        });
        console.error(
          await page.evaluate(() =>
            [...document.querySelectorAll("main *")]
              .filter((e) => e.getBoundingClientRect().right > innerWidth)
              .slice(0, 8)
              .map((e) => ({
                tag: e.tagName,
                cls: e.className,
                text: e.textContent.slice(0, 120),
              })),
          ),
        );
        throw new Error(
          `Overflow ${width}: ${lessons[i].moduleId}/${lessons[i].slug}`,
        );
      }
      if (
        [
          "introduction-to-tensors",
          "llms-for-science",
          "monitoring",
          "launch",
          "normal-vs-anomalous",
        ].includes(lessons[i].slug)
      ) {
        await page.screenshot({
          path: `test-results/content-review/${lessons[i].slug}-${width}.png`,
          fullPage: true,
        });
        await page.locator('[data-testid="epilogue"]').scrollIntoViewIfNeeded();
        await page.screenshot({
          path: `test-results/content-review/${lessons[i].slug}-${width}-scene.png`,
        });
        await page.evaluate(() => scrollTo(0, 0));
      }
      checked.push({
        module: lessons[i].moduleId,
        lesson: lessons[i].slug,
        width,
      });
    }
  }
  expect(errors).toEqual([]);
  writeFileSync(
    "test-results/content-review/results.json",
    JSON.stringify(
      {
        checked,
        errors,
        scope:
          "Local production renderer; editor and external boundaries stubbed",
      },
      null,
      2,
    ),
  );
  console.log(
    `Rendered ${lessons.length} lessons at desktop/mobile widths; no page errors or horizontal overflow.`,
  );
} finally {
  await browser?.close();
  await server.close();
}
