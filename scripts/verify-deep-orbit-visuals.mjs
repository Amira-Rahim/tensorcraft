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
const base = process.env.UI_AUDIT_BASE ?? "http://localhost:3126";
const out =
  process.env.UI_AUDIT_OUT ?? "docs/design-previews/deep-orbit-rollout";
mkdirSync(out, { recursive: true });
const productionHTML = await (
  await fetch(base + "/worlds/deep-orbit/foundations/introduction-to-tensors")
).text();
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
  server: { host: "127.0.0.1", port: 0, hmr: false, proxy: { "/_next": base } },
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
// Render every lesson with production components and compiled MDX. The fixture
// isolates account/network boundaries only; it does not grant production access.
const lessonFilter = process.env.UI_AUDIT_LESSONS?.split(",");
const lessons = JSON.parse(
  readFileSync(
    path.join(root, "packages/content/.velite/lessons.json"),
    "utf8",
  ),
).filter(
  (l) =>
    l.worldId === "deep-orbit" &&
    (!lessonFilter || lessonFilter.includes(l.slug)),
);
const records = [],
  failures = [],
  errors = [];
const phases = ["Briefing", "Concept", "Challenge", "Takeaways", "Epilogue"];
const focusSlugs = new Set([
  "introduction-to-tensors",
  "tensor-shapes",
  "tensor-operations",
  "data-loading",
  "normalization",
  "first-neuron",
  "activation-functions",
  "layers-and-architecture",
  "loss-functions",
  "gradient-descent",
  "backpropagation",
  "training-loop",
  "evaluating-deep-scan",
  "spectrograms",
  "lstm-gates",
  "temporal-attention",
  "kalman-filters",
  "reconstruction-error",
  "quantization",
  "rag-for-signals",
  "launch",
]);
let browser;
try {
  await server.listen();
  const fixtureBase = "http://127.0.0.1:" + server.httpServer.address().port;
  console.log("Fixture:", fixtureBase + "/__ui-audit");
  browser = await chromium.launch();
  const modes = [
    { width: 1440, height: 1000, scheme: "dark" },
    { width: 320, height: 760, scheme: "light" },
    { width: 390, height: 844, scheme: "dark" },
    { width: 1440, height: 1000, scheme: "light" },
  ];
  for (const mode of modes) {
    const context = await browser.newContext({
      viewport: { width: mode.width, height: mode.height },
      colorScheme: mode.scheme,
      reducedMotion: "reduce",
    });
    await context.route("**/*", (route) =>
      ["127.0.0.1", "localhost"].includes(
        new URL(route.request().url()).hostname,
      )
        ? route.continue()
        : route.abort(),
    );
    const page = await context.newPage();
    page.on("pageerror", (e) => {
      errors.push(e.message);
      console.log("PAGE ERROR", e.message);
    });
    await page.goto(fixtureBase + "/__ui-audit");
    await page.waitForFunction(() => window.fixtureReady, { timeout: 60000 });
    await page.evaluate((scheme) => {
      localStorage.setItem("tc-cookie-consent", "declined");
      localStorage.setItem("tc-script-skip", "1");
      localStorage.setItem("tc-scheme", scheme);
      document.documentElement.dataset.scheme = scheme;
    }, mode.scheme);
    for (const [index, lesson] of lessons.entries()) {
      const phaseList =
        (mode.width === 1440 && mode.scheme === "dark") || mode.width === 320
          ? [0, 1, 2, 3, 4]
          : [1];
      for (const phase of phaseList) {
        const id = `${lesson.slug}-${phase}-${mode.width}-${mode.scheme}`;
        await page.evaluate(
          async ({ lesson, phase, scheme }) => {
            const suffix = `deep-orbit_${lesson.slug}:account:ui-audit-fixture`;
            localStorage.setItem(`tc_step_v2_${suffix}`, String(phase));
            localStorage.setItem(`tc_step_max_v2_${suffix}`, "4");
            localStorage.setItem(`tc_recall_${suffix}`, "1");
            await window.showAudit("lesson", {
              module: lesson.moduleId,
              slug: lesson.slug,
            });
            document.documentElement.dataset.scheme = scheme;
          },
          { lesson, phase, scheme: mode.scheme },
        );
        await expect(
          page.getByRole("heading", {
            level: 1,
            name: lesson.title,
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          page.getByRole("group", {
            name: `Step ${phase + 1} of 5: ${phases[phase]}`,
            exact: true,
          }),
        ).toBeVisible({ timeout: 30000 });
        await page.evaluate(() => document.fonts.ready);
        if (phase === 1) {
          await expect(page.getByTestId("lesson-workbench")).toBeVisible();
          const image = page.locator(".mission-context-image img").first();
          await expect(image).toBeVisible();
          await expect
            .poll(() =>
              image.evaluate((el) => el.complete && el.naturalWidth > 0),
            )
            .toBe(true);
          const instrument = page.locator(".lesson-instrument");
          const before = await instrument.innerText();
          const range = instrument.getByRole("slider").first();
          if (await range.count()) {
            await range.focus();
            await page.keyboard.press(
              (await range.inputValue()) === (await range.getAttribute("max"))
                ? "Home"
                : "End",
            );
          } else {
            await instrument.getByRole("button").nth(1).click();
          }
          if ((await instrument.innerText()) === before)
            failures.push({
              id,
              reason: "instrument did not change its explanation or output",
            });
          // Restore a clean initial composition after exercising the control.
          await page.evaluate(() => document.activeElement?.blur());
        }
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        );
        if (overflow) failures.push({ id, reason: "page overflow" });
        if (
          phase === 1 &&
          ((mode.width === 1440 && mode.scheme === "dark") ||
            focusSlugs.has(lesson.slug))
        ) {
          const axe = await new AxeBuilder({ page })
            .include(".lesson-workbench")
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze();
          if (axe.violations.length)
            failures.push({
              id,
              violations: axe.violations.map((v) => ({
                id: v.id,
                nodes: v.nodes.map((n) => ({
                  target: n.target,
                  summary: n.failureSummary,
                })),
              })),
            });
          records.push({ id, axe: true, overflow });
        } else records.push({ id, overflow });
        if (focusSlugs.has(lesson.slug) && phase === 1) {
          await page.evaluate(() => {
            window.scrollTo(0, 0);
            document.querySelector(".lesson-page")?.scrollTo(0, 0);
          });
          await page
            .locator(".lesson-workbench")
            .screenshot({ path: `${out}/${id}.png` });
          if (process.env.UI_AUDIT_FULL_READ === "1") {
            const read = page.locator(
              '.lesson-step-content[data-layout="reading"]',
            );
            await read.screenshot({ path: `${out}/${id}-read.png` });
            records[records.length - 1].readingHeight = await read.evaluate(
              (el) => el.getBoundingClientRect().height,
            );
          }
        }
        if (
          lesson.slug === "introduction-to-tensors" &&
          [0, 2, 4].includes(phase)
        )
          await page.screenshot({ path: `${out}/${id}.png`, fullPage: true });
      }
      if ((index + 1) % 14 === 0)
        console.log(
          mode.width,
          mode.scheme,
          index + 1,
          "/",
          lessons.length,
          "lessons",
        );
    }
    await context.close();
  }
} finally {
  writeFileSync(
    `${out}/verification.json`,
    JSON.stringify(
      {
        scope:
          "Production components and MDX; isolated account/network fixture",
        views: records.length,
        axeScans: records.filter((r) => r.axe).length,
        errors,
        failures,
        records,
      },
      null,
      2,
    ),
  );
  await browser?.close();
  await server.close();
}
console.log(
  JSON.stringify({
    views: records.length,
    failures: failures.length,
    errors: errors.length,
  }),
);
if (failures.length || errors.length) process.exitCode = 1;
