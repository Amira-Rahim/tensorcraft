#!/usr/bin/env node
// Structure-variety counter for built lesson MDX.
//
// Born in the P2 structure-variety sprint (2026-07-12). The six audit rounds
// before it proved that mechanical whole-corpus counts catch what per-lesson
// judgment misses (lockstep, monoculture, batch fingerprints), so this script
// is the measuring instrument for lesson-structure distribution and the data
// source for the variety regression test.
//
// Usage:
//   node scripts/audit-structure-variety.mjs           # human table
//   node scripts/audit-structure-variety.mjs --json    # machine-readable
//
// Measures per lesson:
//   opener      first element after frontmatter: dialogue | prose | code | component
//   pattern     frontmatter pedagogical pattern (default "standard")
//   scene       whether the scene: slugline block is populated
//   takeaways   LessonRecap whatYouLearned bullet count
//   recall      RecallPrompt count
//   dispatch    DispatchTease count
//   boss        BossBeat count
//   ariaTic     ARIA "Observation..." / "I have no rule" epilogue-cadence hits

// Exported for the regression gate (packages/content/__tests__/
// structure-variety.test.ts) so counter and gate share ONE parser — the
// P1 stripper split-brain taught us what duplicated corpus parsers do.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
/** All themes live here; per-theme dirs are its children. */
export const CONTENT_ROOT = join(ROOT, "packages", "content", "content");
// Kept for back-compat with existing importers; prefer CONTENT_ROOT + a
// theme dir. The hardcoded deep-orbit anchor was a gate bug: analyze()
// computed lesson ids relative to THIS dir, so every other theme's lessons
// resolved to "../<theme>/..." and moduleOf() collapsed to ".." — the
// per-module variety floor silently measured one giant bucket (fresh-eyes
// rerun §6, T2-23).
export const CONTENT_DIR = join(CONTENT_ROOT, "deep-orbit");

export function lessonFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "exercises") continue;
      out.push(...lessonFiles(full));
    } else if (entry.endsWith(".mdx")) {
      out.push(full);
    }
  }
  return out.sort();
}

function splitFrontmatter(source) {
  const m = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { fm: "", body: source };
  return { fm: m[1], body: source.slice(m[0].length) };
}

// First meaningful element of the body. Classification is deliberately
// coarse; the audit cares about "Dialogue vs not", finer labels are context.
function classifyOpener(body) {
  const line = body.split("\n").find((l) => l.trim() !== "");
  if (!line) return "empty";
  const t = line.trim();
  if (t.startsWith("<Dialogue")) return "dialogue";
  if (t.startsWith("<CodeBlock")) return "code";
  if (t.startsWith("<")) {
    const name = (t.match(/^<([A-Za-z]+)/) ?? [])[1] ?? "component";
    return `component:${name}`;
  }
  return "prose";
}

function fmValue(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*(\\S.*)$`, "m"));
  return m ? m[1].trim() : undefined;
}

function countTakeaways(body) {
  const m = body.match(/whatYouLearned=\{\[([\s\S]*?)\]\}/);
  if (!m) return 0;
  // Count top-level string entries with a quote state machine; recaps are
  // authored both one-per-line and single-line, so line anchors undercount.
  let count = 0;
  let inString = false;
  for (let i = 0; i < m[1].length; i++) {
    const ch = m[1][i];
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === '"') {
      if (!inString) count++;
      inString = !inString;
    }
  }
  return count;
}

export function analyze(file) {
  const source = readFileSync(file, "utf8");
  const { fm, body } = splitFrontmatter(source);
  // Lesson id is "module/lesson" for EVERY theme: resolve against the
  // content root and strip the theme segment. (Previously relative to the
  // deep-orbit dir, which turned other themes' ids into "../..." — T2-23.)
  const rel = relative(CONTENT_ROOT, file)
    .replace(/\.mdx$/, "")
    .split("/")
    .slice(1)
    .join("/");
  const ariaBlocks =
    body.match(/<Dialogue speaker="ARIA">[\s\S]*?<\/Dialogue>/g) ?? [];
  const ariaText = ariaBlocks.join("\n");
  return {
    lesson: rel,
    opener: classifyOpener(body),
    pattern: fmValue(fm, "pattern") ?? "standard",
    scene: /^scene:/m.test(fm),
    takeaways: countTakeaways(body),
    recall: (body.match(/<RecallPrompt/g) ?? []).length,
    dispatch: (body.match(/<DispatchTease/g) ?? []).length,
    dispatchMention: (body.match(/DISPATCH/g) ?? []).length,
    boss: (body.match(/<BossBeat/g) ?? []).length,
    ariaTic:
      (ariaText.match(/Observation[.:]/g) ?? []).length +
      (ariaText.match(/I have no rule/g) ?? []).length,
  };
}

export function summarize(rows) {
  const dist = (key) => {
    const d = {};
    for (const r of rows) d[r[key]] = (d[r[key]] ?? 0) + 1;
    return d;
  };
  return {
    lessons: rows.length,
    openers: dist("opener"),
    patterns: dist("pattern"),
    sceneCount: rows.filter((r) => r.scene).length,
    takeawayCounts: dist("takeaways"),
    recallTotal: rows.reduce((a, r) => a + r.recall, 0),
    dispatchLessons: rows.filter((r) => r.dispatch > 0).length,
    dispatchMentionLessons: rows.filter((r) => r.dispatchMention > 0).length,
    bossLessons: rows.filter((r) => r.boss > 0).length,
    ariaTicTotal: rows.reduce((a, r) => a + r.ariaTic, 0),
  };
}

// CLI body: only when executed directly, so the gate test can import the
// parser without triggering a report dump.
const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (!isMain) {
  // imported as a module: no side effects
} else {
  main();
}

function main() {
  // CLI counts every theme dir on disk (un-anchored from deep-orbit,
  // T2-23). `--theme <dir>` scopes to one.
  const themeArgIdx = process.argv.indexOf("--theme");
  const themes =
    themeArgIdx !== -1
      ? [process.argv[themeArgIdx + 1]]
      : readdirSync(CONTENT_ROOT).filter((d) =>
          statSync(join(CONTENT_ROOT, d)).isDirectory(),
        );
  for (const theme of themes) {
    const rows = lessonFiles(join(CONTENT_ROOT, theme)).map(analyze);
    if (rows.length === 0) continue;
    console.log(`\n=== ${theme} ===`);
    report(rows, summarize(rows));
  }
}

function report(rows, summary) {
  if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ summary, rows }, null, 2));
} else {
  const pad = (s, n) => String(s).padEnd(n);
  console.log(
    pad("lesson", 46) +
      pad("opener", 22) +
      pad("pattern", 18) +
      pad("scn", 4) +
      pad("tk", 3) +
      pad("rc", 3) +
      pad("dp", 3) +
      pad("bb", 3) +
      "tic",
  );
  for (const r of rows) {
    console.log(
      pad(r.lesson, 46) +
        pad(r.opener, 22) +
        pad(r.pattern, 18) +
        pad(r.scene ? "y" : "-", 4) +
        pad(r.takeaways, 3) +
        pad(r.recall, 3) +
        pad(r.dispatch, 3) +
        pad(r.boss, 3) +
        r.ariaTic,
    );
  }
  console.log("\nSummary: " + JSON.stringify(summary, null, 2));
  }
}
