/**
 * Records the /learn "Watch a lesson" video: a real walkthrough of the free
 * first lesson (briefing playback, the concept bridge, the code step), saved
 * as webm + a poster frame for a click-to-play `<video preload="none">` band.
 *
 * Output (owner reviews the cut before anything ships on /learn):
 *   apps/web/public/media/lesson-walkthrough.webm
 *   apps/web/public/media/lesson-walkthrough-poster.webp
 *
 * Usage:
 *   pnpm --filter @tensorcraft/web dev   # in another terminal
 *   node scripts/marketing/capture-lesson-walkthrough.mjs
 *
 * BASE_URL overrides the default http://localhost:3000. The run needs the
 * Playwright chromium the e2e suite already uses. Re-running overwrites both
 * files; an externally produced video can replace them at the same paths.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("@playwright/test");

// sharp is a root devDependency but pnpm does not hoist it to the top-level
// node_modules; fall back to the store (same loader as scripts/art/ingest.mjs).
function loadSharp() {
  try {
    return require("sharp");
  } catch {
    const store = path.join(repoRoot(), "node_modules/.pnpm");
    const dir = fs.readdirSync(store).find((d) => d.startsWith("sharp@"));
    if (!dir) throw new Error("sharp not found; run pnpm install");
    return require(path.join(store, dir, "node_modules/sharp"));
  }
}

function repoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const LESSON_PATH = "/worlds/deep-orbit/foundations/introduction-to-tensors";
const OUT_DIR = path.join(repoRoot(), "apps/web/public/media");
const VIDEO_OUT = path.join(OUT_DIR, "lesson-walkthrough.webm");
const POSTER_OUT = path.join(OUT_DIR, "lesson-walkthrough-poster.webp");
// 1280x800 matches the visual-regression viewport, so the recording shows
// the exact layout the baselines pin.
const SIZE = { width: 1280, height: 800 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function assertServerUp() {
  try {
    const res = await fetch(BASE_URL, { redirect: "manual" });
    if (res.status >= 500) throw new Error(`status ${res.status}`);
  } catch (err) {
    console.error(
      `No dev server at ${BASE_URL} (${err.message ?? err}).\n` +
        "Start one first: pnpm --filter @tensorcraft/web dev",
    );
    process.exit(1);
  }
}

/** Slow scroll so the recording reads as a person browsing, not a jump cut. */
async function driftScroll(page, steps, pixels, holdMs) {
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, pixels);
    await sleep(holdMs);
  }
}

async function main() {
  await assertServerUp();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: SIZE,
    colorScheme: "dark",
    recordVideo: { dir: OUT_DIR, size: SIZE },
  });
  const page = await context.newPage();

  // Fresh lesson state; consent declined so the cookie banner never enters
  // the frame (and no analytics fires from a marketing recording).
  await page.addInitScript(() => {
    localStorage.removeItem("tc_step_deep-orbit_introduction-to-tensors");
    localStorage.removeItem("tc_step_max_deep-orbit_introduction-to-tensors");
    localStorage.setItem("tc-cookie-consent", "declined");
  });

  console.log(`-> ${BASE_URL}${LESSON_PATH}`);
  // Generous timeout: a cold next dev compiles the lesson route on first hit.
  await page.goto(`${BASE_URL}${LESSON_PATH}`, { timeout: 120_000 });
  await page.waitForSelector("[data-script-state='playing']", {
    timeout: 60_000,
  });

  // Poster: mid-briefing, once a few beats (and a developed avatar) are on
  // screen. Falls back to whatever is visible if the beats stall.
  let posterPng = null;
  for (let i = 0; i < 20; i++) {
    if ((await page.locator("[data-beat-shown]").count()) >= 3) break;
    await sleep(600);
  }
  posterPng = await page.screenshot({ type: "png" });

  // Let the briefing play out in full (about 15s on this lesson), then hold
  // while the auto-scroll brings the explanation up.
  await page.waitForSelector("[data-script-state='done']", {
    timeout: 60_000,
  });
  await sleep(2500);

  // Concept step: the bridge callout is the teaching method on screen.
  await page.getByRole("button", { name: "Step 2: Concept" }).click();
  await sleep(2500);
  await driftScroll(page, 4, 420, 1400);

  // Code step: the editor is the product proof. Sandpack is lazy and slow on
  // a dev server; wait, then hold the frame. Best effort from here on: the
  // recording still ends cleanly if the editor or the run flow stalls.
  await page.getByRole("button", { name: "Step 3: Code" }).click();
  try {
    await page.waitForSelector("[class*='sp-'] .cm-editor, .sp-code-editor", {
      timeout: 60_000,
    });
    await sleep(3000);
    await driftScroll(page, 2, 380, 1200);

    // Show the solution and run it so the video ends on passing tests.
    const solution = page.getByRole("button", { name: /solution/i }).first();
    if (await solution.isVisible().catch(() => false)) {
      await solution.click();
      await sleep(1500);
    }
    const run = page.getByRole("button", { name: /^run/i }).first();
    if (await run.isVisible().catch(() => false)) {
      await run.click();
      await page
        .getByText(/passed|pass/i)
        .first()
        .waitFor({ timeout: 45_000 })
        .catch(() => console.warn("run: no pass state seen, keeping footage"));
      await sleep(3500);
    }
  } catch {
    console.warn("code step: editor never settled, keeping footage as-is");
    await sleep(3000);
  }

  const video = page.video();
  await context.close();
  await browser.close();

  // recordVideo writes a hashed filename; move it onto the stable path.
  const rawPath = await video.path();
  fs.copyFileSync(rawPath, VIDEO_OUT);
  fs.rmSync(rawPath);

  const sharp = loadSharp();
  await sharp(posterPng).webp({ quality: 82 }).toFile(POSTER_OUT);

  const mb = (f) => (fs.statSync(f).size / 1024 / 1024).toFixed(2);
  console.log(`video  ${VIDEO_OUT} (${mb(VIDEO_OUT)} MB)`);
  console.log(`poster ${POSTER_OUT} (${mb(POSTER_OUT)} MB)`);
  console.log(
    "Review the cut before wiring the /learn video band (plan Phase 2).",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
