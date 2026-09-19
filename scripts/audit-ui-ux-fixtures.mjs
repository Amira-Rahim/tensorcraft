// Local UI-only fixtures. Production page/component code and production CSS/fonts.
// Auth, database reads, analytics and external APIs are isolated. No real account
// access, payment, certificate issuance, email or GitHub operation is performed.
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const base = process.env.UI_AUDIT_BASE ?? "http://localhost:3118";
const verify = process.argv.includes("--verify");
const out = process.env.UI_AUDIT_OUT ?? "test-results/ui-ux-audit";
mkdirSync(out, { recursive: true });
const productionHTML = await (await fetch(base)).text();
const css = [...productionHTML.matchAll(/<link[^>]+href="([^"]+\.css)"[^>]*>/g)]
  .map((x) => `<link rel="stylesheet" href="${x[1]}">`)
  .join("");
if (!css) throw new Error("No production CSS");
const htmlClass = productionHTML.match(/<html[^>]+class="([^"]+)"/)?.[1] ?? "";
const bodyClass = productionHTML.match(/<body class="([^"]+)"/)?.[1] ?? "";
const user = {
  id: "ui-audit-fixture",
  email: "learner@example.test",
  user_metadata: { display_name: "Alex Chen" },
};
const cert = {
  id: "11111111-1111-4111-8111-111111111111",
  world_id: "deep-orbit",
  issued_at: "2026-09-18T12:00:00Z",
  cert_hash: "audit-preview-only",
  pdf_url: null,
  user_display_name: "Alex Chen",
  user_avatar_url: null,
};
const database = `
import {getWorldLessons} from '@tensorcraft/content';
const user=${JSON.stringify(user)};
export function rows(table){
 const scenario=window.fixtureScenario??'dashboard';
 const all=getWorldLessons('deep-orbit');
 const completed=scenario==='first-run'?[]:all.slice(0,scenario==='capstone'?all.length:8);
 const progress=completed.map((l,i)=>({world_id:'deep-orbit',module_id:l.moduleId,lesson_id:l.slug,status:'completed',completed_at:new Date(Date.now()-i*86400000).toISOString(),updated_at:new Date(Date.now()-i*86400000).toISOString()}));
 const profile={display_name:'Alex Chen',avatar_url:'',github_username:'alex-example',github_connected:false,email_alerts:true,weekly_digest:true,experience_level:'intermediate'};
 if(table==='profiles')return [profile];
 if(table==='world_progress')return progress;
 if(table==='streaks')return scenario==='first-run'?[]:[{world_id:'deep-orbit',current_streak:3,longest_streak:7,last_activity_date:new Date().toISOString().slice(0,10)}];
 if(table==='exercise_attempts')return completed.map((l,i)=>({world_id:'deep-orbit',lesson_id:l.slug,score:100-i%3*10,passed:true,hints_used:i%3,attempted_at:new Date(Date.now()-i*86400000).toISOString()}));
 if(table==='skill_genome')return [{skill_axis:'data_prep',proficiency:75,velocity:5},{skill_axis:'model_arch',proficiency:40,velocity:2}];
 if(table==='certificates')return [${JSON.stringify(cert)}];
 if(table==='purchases')return scenario==='purchase-pending'?[]:[{plan_id:'single-world',world_ids:['deep-orbit'],amount:50,created_at:'2026-09-18T12:00:00Z',stripe_session_id:'cs_test_ui_audit',status:scenario==='purchase-failed'?'failed':'completed'}];
 return [];
}
function from(table){let single=false;const q=new Proxy({}, {get(_,k){if(k==='then')return (resolve,reject)=>Promise.resolve({data:single?(rows(table)[0]??null):rows(table),error:null}).then(resolve,reject);if(['insert','update','delete','upsert'].includes(k))return ()=>{throw new Error('Audit fixture rejects database writes')};if(k==='single'||k==='maybeSingle')return ()=>{single=true;return q};return ()=>q;}});return q;}
const client={from,auth:{getUser:async()=>({data:{user},error:null}),getSession:async()=>({data:{session:{user,access_token:'LOCAL_FIXTURE_ONLY'}},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},rpc:async()=>({data:[],error:null})};
export const getSupabaseBrowserClient=()=>client;
export const getSupabaseServerClient=async()=>client;
`;
const stubs = {
  "next/navigation": `export const usePathname=()=>window.fixturePath??'/dashboard',useSearchParams=()=>new URLSearchParams(location.search),useRouter=()=>({push:p=>{window.fixtureNavigation=p},replace:p=>{window.fixtureNavigation=p},refresh(){},back(){}}),redirect=p=>{throw new Error('Fixture redirect: '+p)},notFound=()=>{throw new Error('Fixture 404')};`,
  "next/link": `import React from 'react';export default function({href,children,prefetch,replace,scroll,...props}){return React.createElement('a',{href,...props},children)}`,
  "next/image": `import React from 'react';export default function({src,alt,fill,priority,unoptimized,quality,placeholder,blurDataURL,style,...props}){return React.createElement('img',{src:typeof src==='string'?src:src.src,alt,...props,style:fill?{position:'absolute',height:'100%',width:'100%',inset:0,color:'transparent',...style}:style})}`,
  "next/dynamic": `import React,{Suspense,lazy} from 'react';export default function(loader,options={}){const C=lazy(()=>loader().then(m=>({default:m.default??m})));return p=>React.createElement(Suspense,{fallback:options.loading?React.createElement(options.loading):null},React.createElement(C,p));}`,
  "@/lib/supabase/server": database,
  "@/lib/supabase/client": database,
  "@/lib/entitlements": `export const getEntitledWorlds=async()=>new Set(['deep-orbit']);`,
  "@/lib/progress": `import {rows} from '@/lib/supabase/server';export const getUserProgress=async()=>rows('world_progress'),getPassedExercises=async()=>({slugs:[],unavailable:false}),hasWorldPurchase=async()=>true,isModuleCompleted=async()=>window.fixtureScenario!=='prerequisite';`,
  "@/lib/review-store-server": `export const resolveDueForUser=async()=>[];`,
  "@/lib/progress-client": `export const markLessonStarted=async()=>{},markLessonCompleted=async()=>true,emitSkillEvent=async()=>{},updateExerciseProgress=async()=>{},getLessonExerciseStatus=async()=>[];`,
  "@/lib/review-store-api": `export const enqueueReviews=()=>{},recordReview=()=>{},flushReviewOutbox=async()=>{},mergeGuestReviews=async()=>true;`,
  "@/lib/boss-beat-client": `export const BOSS_BEAT_CHANGED='boss-beat-changed',getBossBeatChoice=async()=>null,recordBossBeatChoice=async()=>{throw new Error('Read-only audit fixture')};`,
  "@/lib/api-url": `export const getApiUrl=()=>location.origin;`,
  "@/lib/api-fetch": `export const apiFetch=async()=>new Response(JSON.stringify({choices:[],choice:null}),{status:200,headers:{'Content-Type':'application/json'}});`,
  "@/lib/report-data-error": `export const reportDataError=()=>{};`,
  "@/lib/analytics": `export const EVENTS=new Proxy({},{get:(_,key)=>key});export const ${["track", "capture", "identify", "reset", "trackLessonStarted", "trackLessonCompleted", "trackExerciseSubmitted", "trackCheckoutStarted", "trackCheckoutCompleted", "trackWorldSelected", "trackStreakAchieved", "trackHintRequested", "trackCheckpointSubmitted", "trackRecallAnswered", "trackPricingPageViewed", "trackModuleCompleted"].map((n) => n + "=()=>{}").join(",")};`,
  "@/lib/analytics-events": `export const EVENTS=new Proxy({},{get:(_,key)=>key}),track=()=>{};`,
};
const html = `<!doctype html><html lang="en" class="${htmlClass}" data-world="deep-orbit"><head><title>Isolated UI audit fixture</title>${css}</head><body class="${bodyClass}"><div id="root"></div><script type="module">
import React from 'react';import {createRoot} from 'react-dom/client';
import {WorldProvider} from '/apps/web/app/components/world-provider.tsx';
import {ReportIssueButton} from '/apps/web/app/components/report-issue-button.tsx';
import {Nav} from '/apps/web/app/components/nav.tsx';import {SiteFooter} from '/apps/web/app/components/site-footer.tsx';
import Dashboard from '/apps/web/app/dashboard/page.tsx';import Settings from '/apps/web/app/settings/page.tsx';import Onboarding from '/apps/web/app/onboarding/page.tsx';
import Capstone from '/apps/web/app/worlds/[slug]/capstone/page.tsx';import Certificate from '/apps/web/app/certificates/[id]/page.tsx';import Purchase from '/apps/web/app/dashboard/purchase-success/page.tsx';
import Lesson from '/apps/web/app/worlds/[slug]/[module]/[lesson]/page.tsx';
import DashboardLoading from '/apps/web/app/dashboard/loading.tsx';import SettingsLoading from '/apps/web/app/settings/loading.tsx';import PricingLoading from '/apps/web/app/pricing/loading.tsx';import LessonError from '/apps/web/app/worlds/[slug]/[module]/[lesson]/error.tsx';import RouteError from '/apps/web/app/error.tsx';
const statePages={'dashboard-loading':DashboardLoading,'settings-loading':SettingsLoading,'pricing-loading':PricingLoading,'lesson-error':LessonError,'route-error':RouteError};
const pages={dashboard:Dashboard,'first-run':Dashboard,settings:Settings,capstone:Capstone,certificate:Certificate,'purchase-success':Purchase,'purchase-pending':Purchase,'purchase-failed':Purchase,lesson:Lesson,prerequisite:Lesson};
const root=createRoot(document.getElementById('root'));
window.showAudit=async(scenario,lesson)=>{
 root.render(null);history.replaceState(null,'',location.pathname);window.fixtureRender=(window.fixtureRender??0)+1;window.fixtureScenario=scenario;window.fixturePath=scenario==='lesson'?'/worlds/deep-orbit/'+lesson.module+'/'+lesson.slug:scenario==='first-run'?'/dashboard':'/'+scenario;
 const params=scenario==='certificate'?{id:'${cert.id}'}:{slug:'deep-orbit',module:lesson?.module??'neural-networks',lesson:lesson?.slug??'what-is-a-neuron'};
 const element=statePages[scenario]?React.createElement(statePages[scenario],{error:new Error('Isolated audit fixture'),reset:()=>{}}):scenario==='onboarding'?React.createElement(Onboarding):await pages[scenario]({params:Promise.resolve(params),searchParams:Promise.resolve(scenario.startsWith('purchase-')?{session_id:'cs_test_ui_audit'}:{})});
 root.render(React.createElement(WorldProvider,{key:window.fixtureRender},React.createElement(Nav),React.createElement('div',{id:'main-content',className:'flex-1'},element),React.createElement(SiteFooter),React.createElement(ReportIssueButton)));
 return true;
};window.fixtureReady=true;
</script></body></html>`;
const server = await createServer({
  root,
  configFile: false,
  define: { "process.env": "{}" },
  publicDir: path.join(root, "apps/web/public"),
  server: { host: "127.0.0.1", port: 0, proxy: { "/_next": base } },
  resolve: {
    alias: {
      react: path.join(root, "packages/ui/node_modules/react"),
      "react-dom": path.join(root, "packages/ui/node_modules/react-dom"),
      "@tensorcraft/worlds": path.join(root, "packages/worlds/src"),
      "@tensorcraft/shared": path.join(root, "packages/shared/src"),
      "@tensorcraft/ui": path.join(root, "packages/ui/src"),
      "@tensorcraft/content": path.join(root, "packages/content/src"),
      "@": path.join(root, "apps/web"),
    },
  },
  plugins: [
    {
      name: "audit-boundaries",
      enforce: "pre",
      resolveId(id, importer) {
        let key = id;
        if (id.startsWith(".") && importer?.startsWith(root + "/apps/web/"))
          key = path.resolve(path.dirname(importer), id);
        if (key.startsWith(root + "/apps/web/"))
          key =
            "@/" +
            key
              .slice((root + "/apps/web/").length)
              .replace(/\.(tsx?|jsx?)$/, "");
        if (stubs[key]) return "\0audit:" + key;
      },
      load(id) {
        if (id.startsWith("\0audit:")) return stubs[id.slice(7)];
      },
    },
    react(),
    {
      name: "audit-page",
      configureServer(s) {
        s.middlewares.use("/api/certificates", (_q, r) => {
          r.setHeader("Content-Type", "application/json");
          r.end(JSON.stringify(cert));
        });
        s.middlewares.use("/__ui-audit", async (_q, r, next) => {
          try {
            r.setHeader("Content-Type", "text/html");
            r.end(await s.transformIndexHtml("/__ui-audit", html));
          } catch (e) {
            next(e);
          }
        });
      },
    },
  ],
});
let browser;
const records = [];
const lessonMode = process.argv.includes("--lessons");
const statesMode = process.argv.includes("--states");
const supportMode = process.argv.includes("--support");
const responsiveMode = supportMode || process.argv.includes("--responsive");
const instructionMode = process.argv.includes("--instructions");
const richMode = instructionMode || process.argv.includes("--rich");
const lessonCases = JSON.parse(
  readFileSync(
    path.join(root, "packages/content/.velite/lessons.json"),
    "utf8",
  ),
).filter((l) => l.worldId === "deep-orbit");
try {
  await server.listen();
  const fixtureBase = "http://127.0.0.1:" + server.httpServer.address().port;
  browser = await chromium.launch();
  for (const mode of (statesMode
    ? [
        { width: 1440, height: 900, scheme: "dark" },
        { width: 320, height: 667, scheme: "light" },
      ]
    : responsiveMode
      ? [
          { width: 390, height: 844, scheme: "dark" },
          { width: 320, height: 667, scheme: "light" },
          { width: 810, height: 1080, scheme: "dark" },
        ]
      : [
          { width: 1440, height: 900, scheme: "dark" },
          { width: 390, height: 844, scheme: "dark" },
          { width: 1440, height: 900, scheme: "light" },
          { width: 390, height: 844, scheme: "light" },
        ]
  ).filter((m) => !(lessonMode || richMode) || m.scheme === "dark")) {
    const context = await browser.newContext({
      viewport: { width: mode.width, height: mode.height },
      colorScheme: mode.scheme,
      reducedMotion: "reduce",
    });
    await context.route("**/*", (route) => {
      const u = new URL(route.request().url());
      return ["127.0.0.1", "localhost"].includes(u.hostname)
        ? route.continue()
        : route.abort();
    });
    await context.addInitScript(() => {
      localStorage.setItem("tc-cookie-consent", "declined");
      localStorage.setItem("tc-script-skip", "1");
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => {
      errors.push(e.message);
      console.log("PAGE ERROR", e.stack);
    });
    await page.goto(fixtureBase + "/__ui-audit");
    await page.waitForFunction(() => window.fixtureReady, { timeout: 60000 });
    for (const scenario of lessonMode || richMode
      ? []
      : statesMode
        ? [
            "dashboard-loading",
            "settings-loading",
            "pricing-loading",
            "lesson-error",
            "route-error",
          ]
        : responsiveMode
          ? supportMode
            ? ["dashboard"]
            : ["dashboard", "settings"]
          : [
              "first-run",
              "dashboard",
              "settings",
              "onboarding",
              "capstone",
              "certificate",
              "purchase-success",
              "purchase-pending",
              "purchase-failed",
            ]) {
      await page.evaluate((s) => window.showAudit(s), scenario);
      await page.waitForFunction(
        () => document.querySelector("#main-content")?.children.length > 0,
      );
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(700);
      await capture(scenario);
      if (supportMode && scenario === "dashboard") {
        const trigger = page.getByRole("button", {
          name: "Report Issue",
          exact: true,
        });
        await trigger.click();
        const dialog = page.getByRole("dialog", { name: "Report an issue" });
        await expect(
          dialog.getByRole("button", { name: "Close", exact: true }),
        ).toBeFocused();
        await page.keyboard.press("Shift+Tab");
        await expect(
          dialog.getByRole("button", { name: /Attach screenshot/ }),
        ).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(dialog).not.toBeVisible();
        await expect(trigger).toBeFocused();
        records.push({
          id: "authenticated-support-focus-" + mode.width,
          passed: true,
          scope: "Isolated authenticated UI fixture",
        });
      }
      if (scenario === "settings" && responsiveMode) {
        await page.getByRole("tab", { name: "Profile", exact: true }).focus();
        await page.keyboard.press(
          mode.width < 768 ? "ArrowRight" : "ArrowDown",
        );
        records.push({
          id: "settings-keyboard-" + mode.width,
          active: await page.evaluate(() => ({
            focus: document.activeElement?.textContent,
            selected: document.querySelector("[role=tab][aria-selected=true]")
              ?.textContent,
            orientation: document
              .querySelector("[role=tablist]")
              ?.getAttribute("aria-orientation"),
            headings: document.querySelectorAll(
              "#main-content h1,#main-content h2",
            ).length,
          })),
        });
      }
      if (verify && scenario === "settings" && responsiveMode) {
        await expect(
          page.getByRole("tab", { name: "Notifications", exact: true }),
        ).toBeFocused();
        await expect(
          page.getByRole("tab", { name: "Notifications", exact: true }),
        ).toHaveAttribute("aria-selected", "true");
        await expect(page.getByRole("tablist")).toHaveAttribute(
          "aria-orientation",
          mode.width < 768 ? "horizontal" : "vertical",
        );
        await expect(
          page.getByRole("heading", {
            level: 1,
            name: "Settings",
            exact: true,
          }),
        ).toBeVisible();
      }
      if (scenario === "settings")
        for (const tab of ["Notifications", "GitHub", "Account"]) {
          await page.getByRole("tab", { name: tab, exact: true }).click();
          await capture("settings-" + tab.toLowerCase());
        }
      if (scenario === "onboarding") {
        await page.getByTestId("onboarding-next").click();
        await capture("onboarding-background");
        await page.getByRole("radio", { name: /intermediate/i }).click();
        await page.getByTestId("onboarding-next").click();
        await capture("onboarding-goal");
        await page.getByRole("radio", { name: /exploring for fun/i }).click();
        await page.getByTestId("onboarding-next").click();
        await capture("onboarding-ready");
      }
    }
    if (richMode) {
      for (const lesson of lessonCases.filter((l) =>
        (instructionMode
          ? [
              "data-loading",
              "why-the-browser",
              "loss-functions",
              "training-loop",
              "evaluating-deep-scan",
            ]
          : [
              "data-loading",
              "threshold-tuning",
              "evaluating-deep-scan",
              "launch",
              "model-loading",
              "prompt-engineering",
              "kalman-filters",
              "the-anomaly",
            ]
        ).includes(l.slug),
      )) {
        for (const step of instructionMode ? [3] : [0, 3]) {
          await page.evaluate(
            ({ l, step }) => {
              localStorage.setItem(
                "tc_step_deep-orbit_" + l.slug + ":account:ui-audit-fixture",
                String(step),
              );
              localStorage.setItem(
                "tc_step_max_deep-orbit_" +
                  l.slug +
                  ":account:ui-audit-fixture",
                "5",
              );
              return window.showAudit("lesson", {
                module: l.moduleId,
                slug: l.slug,
              });
            },
            { l: lesson, step },
          );
          await expect(
            page.getByRole("group", {
              name:
                step === 0 ? "Step 1 of 6: Briefing" : "Step 4 of 6: Challenge",
              exact: true,
            }),
          ).toBeVisible();
          await page.waitForTimeout(400);
          if (step === 3 && mode.width < 1024)
            await page
              .getByRole("button", { name: "Editor", exact: true })
              .click();
          if (instructionMode) {
            // Sandpack loads the editor when it enters the viewport. Long
            // mobile instructions put it below the fold; inspect the settled editor.
            await page.locator(".sp-wrapper").first().scrollIntoViewIfNeeded();
            await expect(page.locator(".cm-content").first()).toBeVisible({
              timeout: 30000,
            });
          }
          await capture(
            "rich-" + lesson.moduleId + "-" + lesson.slug + "-step-" + step,
          );
        }
      }
    }
    if (lessonMode) {
      for (const lesson of lessonCases) {
        await page.evaluate((l) => {
          localStorage.setItem(
            "tc_step_deep-orbit_" + l.slug + ":account:ui-audit-fixture",
            "1",
          );
          localStorage.setItem(
            "tc_step_max_deep-orbit_" + l.slug + ":account:ui-audit-fixture",
            "5",
          );
          return window.showAudit("lesson", {
            module: l.moduleId,
            slug: l.slug,
          });
        }, lesson);
        await expect(
          page.getByRole("group", {
            name: "Step 2 of 6: Concept",
            exact: true,
          }),
        ).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(150);
        await capture("concept-" + lesson.moduleId + "-" + lesson.slug);
      }
    }
    async function capture(name) {
      await page.evaluate(() => scrollTo(0, 0));
      const id = "fixture-" + name + "-" + mode.width + "-" + mode.scheme;
      await page.screenshot({ path: out + "/" + id + ".png" });
      await page.screenshot({
        path: out + "/" + id + "-full.png",
        fullPage: true,
      });
      const metrics = await page.evaluate(() => ({
        width: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
        headings: [...document.querySelectorAll("h1,h2,h3")].map(
          (e) => e.textContent,
        ),
        font: getComputedStyle(document.body).fontFamily,
        scrollContainers: [...document.querySelectorAll("#main-content *")]
          .filter(
            (e) =>
              e.clientWidth > 0 &&
              e.scrollWidth > e.clientWidth + 2 &&
              ["auto", "scroll", "hidden"].includes(
                getComputedStyle(e).overflowX,
              ),
          )
          .slice(0, 30)
          .map((e) => ({
            tag: e.tagName,
            role: e.getAttribute("role"),
            text: e.textContent.slice(0, 90),
            clientWidth: e.clientWidth,
            scrollWidth: e.scrollWidth,
            overflow: getComputedStyle(e).overflowX,
          })),
        rightClippedText: [
          ...document.querySelectorAll(
            "#main-content p,#main-content span,#main-content label",
          ),
        ]
          .filter(
            (e) =>
              e.getBoundingClientRect().width > 0 &&
              e.getBoundingClientRect().right > innerWidth + 2,
          )
          .slice(0, 20)
          .map((e) => ({
            text: e.textContent.slice(0, 90),
            right: e.getBoundingClientRect().right,
          })),
      }));
      if (verify) {
        expect(
          metrics.documentWidth,
          id + " document reflow",
        ).toBeLessThanOrEqual(mode.width + 1);
        if (name === "dashboard" || name === "first-run") {
          const mainWidths = await page
            .locator("#main-content main")
            .evaluateAll((elements) =>
              elements.map((e) => ({
                client: e.clientWidth,
                scroll: e.scrollWidth,
              })),
            );
          expect(mainWidths.length).toBeGreaterThan(0);
          for (const size of mainWidths)
            expect(
              size.scroll,
              id + " dashboard main reflow",
            ).toBeLessThanOrEqual(size.client + 1);
        }
      }
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .exclude('[data-decorative="true"][aria-hidden="true"]')
        .analyze();
      records.push({
        id,
        scope: "Local UI fixture with isolated data and network boundaries",
        ...metrics,
        violations: axe.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
        errors: [...errors],
      });
      writeFileSync(
        out +
          (lessonMode
            ? "/course-results.json"
            : supportMode
              ? "/support-results.json"
              : responsiveMode
                ? "/responsive-results.json"
                : instructionMode
                  ? "/instruction-results.json"
                  : richMode
                    ? "/rich-results.json"
                    : statesMode
                      ? "/state-results.json"
                      : "/fixture-results.json"),
        JSON.stringify(records, null, 2),
      );
      console.log(
        id,
        "overflow=" + (metrics.documentWidth - metrics.width),
        "axe=" + axe.violations.length,
      );
    }
    if (supportMode)
      writeFileSync(
        out + "/support-results.json",
        JSON.stringify(records, null, 2),
      );
    await context.close();
  }
  if (verify) {
    expect(
      records.filter(
        (record) => record.violations?.length || record.errors?.length,
      ),
      "Fixture accessibility and runtime errors (see retained results)",
    ).toEqual([]);
  }
} finally {
  await browser?.close();
  await server.close();
}
