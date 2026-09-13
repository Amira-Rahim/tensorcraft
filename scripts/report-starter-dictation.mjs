#!/usr/bin/env node
/**
 * Starter scoreboard.
 *
 * Prints, for every exercise in the launched worlds, how much of the answer
 * the STARTER's comments hand over. Same measurement as the CI gate in
 * packages/content/__tests__/starter-dictation.test.ts, which imports the same
 * module, so the two cannot disagree.
 *
 * It reads AUTHORED exercise .yaml, not the Velite build, so a starter edit
 * shows up the moment it is saved. No build step needed.
 *
 * Usage:
 *   node scripts/report-starter-dictation.mjs            # full scoreboard
 *   node scripts/report-starter-dictation.mjs --flagged  # offenders only
 *   node scripts/report-starter-dictation.mjs --band     # threshold evidence
 *   node scripts/report-starter-dictation.mjs <slug>     # one starter, verbose
 *
 * Exit code is 0 always: this is a report. The gate is the Vitest file.
 */

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  COVERAGE_LIMIT,
  builtWorldDirs,
  collectStarterCases,
  scoreStarter,
} from "./lib/starter-dictation.mjs";

/**
 * The two pinned calibration sets, copied from the gate so the scoreboard can
 * label the rows a threshold move would break. The gate is the authority.
 */
const KNOWN_GOOD = new Set([
  "training-loop-exercise",
  "incident-baseline-drift",
  "build-autoencoder",
  "inference-cache",
  "quantize-weights",
  "prune-weights",
  "simple-network",
  "retrieve-signals",
  "detect-anomaly",
  "add-tensors",
  "implement-neuron",
  "relu-activation",
]);
// HISTORICAL. These eleven were the audited dictations the limit was
// calibrated against on 2026-09-12; all were de-recipeed the same day, so
// their LIVE coverage no longer says anything about the band. The band
// edges below are frozen at the values measured before that pass.
const KNOWN_BAD = new Set([
  "kalman-filter",
  "incident-missed-anomaly",
  "launch-rehearsal",
  "classify-anomaly",
  "normalize-data",
  "ci-cd-gate",
  "deep-scan-eval",
  "pipeline-architecture",
  "export-model-artifact",
  "write-model-card",
  "tfjs-setup",
]);

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flaggedOnly = args.includes("--flagged");
const showBand = args.includes("--band");
const slug = args.find((a) => !a.startsWith("--"));

const scored = collectStarterCases(
  resolve(repoRoot, "packages/content/content"),
  builtWorldDirs(repoRoot),
)
  .map((c) => ({ ...c, score: scoreStarter(c) }))
  .sort((a, b) => b.score.coverage - a.score.coverage);

function tag(s) {
  if (KNOWN_GOOD.has(s)) return "good";
  if (KNOWN_BAD.has(s)) return "bad ";
  return "    ";
}

if (slug) {
  const one = scored.find((c) => c.slug === slug);
  if (!one) {
    console.error(`No exercise '${slug}' in the launched worlds.`);
    process.exit(0);
  }
  const s = one.score;
  console.log(`\n${one.id}`);
  console.log(`  verdict        ${s.dictates ? "DICTATES" : "ok"}`);
  console.log(
    `  coverage       ${s.namedAnswers.length}/${s.answerCount} = ` +
      `${s.coverage.toFixed(3)} (limit ${COVERAGE_LIMIT})`,
  );
  console.log(`  names          ${s.namedAnswers.join(", ") || "(none)"}`);
  console.log(`  numbered steps ${s.numberedSteps}`);
  console.log(`  quoted calls   ${s.quotedCallSites.join(" | ") || "(none)"}`);
  console.log(`  quoted expr    ${s.quotedExpression || "(none)"}`);
  console.log(`  says recipe    ${s.namesRecipe ? "yes" : "no"}`);
  console.log(`  file           ${one.file}\n`);
  process.exit(0);
}

if (showBand) {
  // The evidence behind COVERAGE_LIMIT: where the two pinned sets stop, and
  // whether anything sits between them.
  const good = scored.filter((c) => KNOWN_GOOD.has(c.slug));
  const bad = scored.filter((c) => KNOWN_BAD.has(c.slug));
  // Frozen at calibration (2026-09-12, before the de-recipe pass): the
  // pinned no-recipe starters topped out at 0.300 (build-autoencoder) and
  // the audited dictations started at 0.333 (ci-cd-gate). Computing these
  // from live coverage went degenerate the moment the dictations were fixed
  // (floor fell to 0.000, below the ceiling, and the probe loop ran empty).
  const ceiling = 0.3;
  const floor = 0.333;
  const liveGoodMax = Math.max(...good.map((c) => c.score.coverage));
  const liveBadMax = Math.max(...bad.map((c) => c.score.coverage));
  const inside = scored.filter(
    (c) => c.score.coverage > ceiling && c.score.coverage < floor,
  );
  console.log(`\nCoverage band, ${scored.length} starter(s)\n`);
  console.log(
    `  known-good ceiling  ${ceiling.toFixed(3)} (build-autoencoder, at calibration; live max today ${liveGoodMax.toFixed(3)})`,
  );
  console.log(
    `  known-bad floor     ${floor.toFixed(3)} (ci-cd-gate, at calibration; live max today ${liveBadMax.toFixed(3)}, the list is historical)`,
  );
  console.log(`  limit in force      ${COVERAGE_LIMIT}`);
  console.log(
    `  starters inside     ${inside.length ? inside.map((c) => c.slug).join(", ") : "(none, the band is empty)"}`,
  );
  const probes = [];
  for (let limit = ceiling; limit < floor; limit += 0.001) probes.push(limit);
  const verdicts = new Set(
    probes.map((limit) =>
      scored
        .filter((c) => c.score.answerCount > 0 && c.score.coverage > limit)
        .map((c) => c.slug)
        .sort()
        .join(" "),
    ),
  );
  console.log(
    `  verdict sets across the band: ${verdicts.size} ` +
      `(1 means every limit in it decides all ${scored.length} starters the same way)\n`,
  );
  process.exit(0);
}

const flagged = scored.filter((c) => c.score.dictates);

console.log(
  `\nStarter dictation, ${scored.length} starter(s), coverage limit ${COVERAGE_LIMIT}\n`,
);
console.log(`  tag  cover  named  steps  call  expr  recipe  slug (module)\n`);
for (const c of flaggedOnly ? flagged : scored) {
  const s = c.score;
  console.log(
    `  ${tag(c.slug)} ${s.dictates ? "X" : " "} ${s.coverage.toFixed(3)} ` +
      `${String(s.namedAnswers.length).padStart(2)}/${String(s.answerCount).padEnd(2)} ` +
      `${String(s.numberedSteps).padStart(5)} ` +
      `${String(s.quotedCallSites.length).padStart(4)} ` +
      `${s.quotedExpression ? "   yes" : "    no"} ` +
      `${s.namesRecipe ? "   yes" : "    no"}  ` +
      `${c.slug} (${c.module})`,
  );
}
console.log(
  `\n${flagged.length} of ${scored.length} starters dictate their exercise.\n` +
    `${flagged.map((c) => c.slug).join(" ")}\n`,
);
