#!/usr/bin/env node
/**
 * Guidance-rung scoreboard.
 *
 * Prints, for every (guidance hint, exercise) pair in the launched worlds,
 * how much of the answer the middle rung of the hint ladder hands over. Same
 * measurement as the CI gate in
 * packages/content/__tests__/guidance-hint-dictation.test.ts, which imports
 * the same module, so the two cannot disagree.
 *
 * It reads AUTHORED lesson .mdx and exercise .yaml, not the Velite build, so
 * a hint edit shows up the moment it is saved. No build step needed.
 *
 * Usage:
 *   node scripts/report-hint-dictation.mjs            # full scoreboard
 *   node scripts/report-hint-dictation.mjs --flagged  # offenders only
 *   node scripts/report-hint-dictation.mjs <slug>     # one exercise, verbose
 *
 * Exit code is 0 always: this is a report. The gate is the Vitest file.
 */

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  COVERAGE_LIMIT,
  builtWorldDirs,
  collectGuidanceCases,
  scoreHint,
} from "./lib/hint-dictation.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flaggedOnly = args.includes("--flagged");
const slug = args.find((a) => !a.startsWith("--"));

const cases = collectGuidanceCases(
  resolve(repoRoot, "packages/content/content"),
  builtWorldDirs(repoRoot),
);

const scored = cases
  .map((c) => ({ ...c, score: scoreHint(c.hint ?? "", c.exercise) }))
  .sort((a, b) => b.score.coverage - a.score.coverage);

if (slug) {
  const one = scored.find((c) => c.slug === slug);
  if (!one) {
    console.error(`No exercise '${slug}' in the launched worlds.`);
    process.exit(0);
  }
  console.log(`\n${one.id}`);
  console.log(`  verdict        ${one.score.dictates ? "DICTATES" : "ok"}`);
  console.log(
    `  coverage       ${one.score.namedAnswers.length}/${one.score.answerCount}` +
      ` = ${one.score.coverage.toFixed(3)} (limit ${COVERAGE_LIMIT})`,
  );
  console.log(
    `  names          ${one.score.namedAnswers.join(", ") || "(none)"}`,
  );
  console.log(
    `  quoted calls   ${one.score.quotedCallSites.join(" | ") || "(none)"}`,
  );
  console.log(`  guidance hint  ${one.hint}\n`);
  process.exit(0);
}

const flagged = scored.filter((c) => c.score.dictates);

console.log(
  `\nGuidance-rung dictation, ${scored.length} pair(s), limit ${COVERAGE_LIMIT}\n`,
);
for (const c of flaggedOnly ? flagged : scored) {
  const mark = c.score.dictates ? "DICTATES" : "ok      ";
  console.log(
    `  ${mark} ${c.score.coverage.toFixed(3)} ` +
      `${String(c.score.namedAnswers.length).padStart(2)}/${String(
        c.score.answerCount,
      ).padEnd(2)} ` +
      `sites ${c.score.quotedCallSites.length} ${c.slug} (${c.lessonId})`,
  );
}
console.log(
  `\n${flagged.length} of ${scored.length} guidance hints dictate their exercise.\n` +
    `${flagged.map((c) => c.slug).join(" ")}\n`,
);
