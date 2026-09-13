/**
 * Starter dictation metric (audit round 6, 2026-09-12).
 *
 * THE FINDING. The exercise lens reads a grade below every other lens, and
 * the largest unactioned reason is the STARTERS. The difficulty auditor
 * counted 42 of 65 starters handing the learner a numbered algorithm to
 * transcribe. Measured over the authored corpus with the metric below: 32 of
 * 65 starters carry three or more numbered comment steps, and 28 of 65 have
 * starter COMMENTS naming 40% or more of the vocabulary the solution adds to
 * the starter. A starter like that turns the exercise into typing. The
 * learner types what the comment says, and the grader certifies the typing.
 *
 * THE STRUCTURAL CAUSE, which is the part worth reading twice. The hint
 * ladder got its dictation gate on 2026-09-08
 * (packages/content/__tests__/guidance-hint-dictation.test.ts, after a
 * submission built from the guidance rung alone passed 55 of 65 exercises).
 * Starters got nothing. There was no test anywhere in the repo reading
 * starterCode for dictation, and the drift shows: four starters rewritten on
 * 2026-09-12 score at the top of this table again (kalman-filter 1.000,
 * classify-anomaly 0.732, launch-rehearsal 0.731, build-lstm 0.600). What is
 * not gated in this repo drifts back.
 *
 * WHAT IS MEASURED, and why these rules and not others. "Is this scaffolding
 * or the answer" is not directly computable, so the module measures three
 * things that are, calibrated against two pinned sets: the 12 starters
 * written deliberately without a recipe, which must pass, and the 11 the
 * round-6 audit named, which must fail. Both sets live in the gate.
 *
 *   RULE 1, COVERAGE, the primary signal. Answer tokens are the identifiers
 *   (3 characters or more) and numeric literals that solutionCode uses and
 *   starterCode's CODE does not: the vocabulary the learner has to supply.
 *   A starter's COMMENTS may name at most 32% of them. Measured on the
 *   authored corpus (2026-09-12): the pinned known-good set tops out at 0.300
 *   (build-autoencoder) and the pinned known-bad set starts at 0.333
 *   (ci-cd-gate), so the limit sits inside a measured empty band, and every
 *   limit from 0.300 to 0.333 returns the identical verdict on all 65
 *   starters. Case is folded before matching, so capitalising a name does not
 *   dodge the rule.
 *
 *   RULE 2, QUOTED CALL SITE. A starter comment may not contain, verbatim, an
 *   answer call site out of solutionCode with its argument list filled in
 *   (`tf.softmax(scores)`, `tf.variableGrads(fn)`). Naming the decision is
 *   teaching. Handing over the call with its arguments is transcription.
 *   Measured: 9 of 65 starters quote one, 0 of the 12 pinned known-good do.
 *   Same rule, same implementation, as the guidance-hint gate's rule 2.
 *
 *   RULE 3, QUOTED EXPRESSION. A starter comment may not contain, verbatim, a
 *   run of solution code carrying a binary operator and two or more distinct
 *   identifiers (`accuracy >= minAccuracy`, `trainAcc - testAcc > 0.15`).
 *   This is the case rule 1 cannot see: when a starter declares rich types,
 *   almost every name in the solution is already given, the answer set
 *   collapses to a handful of tokens, and restating the solution's arithmetic
 *   scores little or no coverage. ci-cd-gate has an answer set of 3 tokens
 *   and clears rule 1 by a single one, while its comments restate
 *   `accuracy >= minAccuracy` character for character. Measured: 14 of 65
 *   starters quote such a run, and all 12 pinned known-good starters score 0
 *   characters, not merely a short run. String and template literals are
 *   masked out of the solution first, or prose inside a template poses as an
 *   expression (measured false positive: write-model-card's
 *   "- Lowest recall: ", 17 characters of markdown).
 *
 *   FLAG 4, THE WORD RECIPE. Flagged wherever it appears in a starter
 *   comment, whatever the three rules say, with its own message. A starter
 *   that announces a recipe is one: both starters that carry the word
 *   (incident-missed-anomaly, classify-anomaly) also sit above 0.9 and 0.73
 *   coverage. Only the literal word is detected, singular or plural. A synonym
 *   doing the same job is banned by the authoring rule and caught by rules 1
 *   to 3, not by a thesaurus in a gate.
 *
 * NUMBERED STEPS ARE EVIDENCE, NOT A TRIGGER, and this was the measurement
 * that decided it. A numbered list naming nothing is an outline, which is
 * allowed: add-tensors and backprop-chain each carry two numbered steps at
 * 0.000 coverage; the original example, three signal-processing outlines
 * with three steps at 0.000, was de-recipeed on 2026-09-12 and is now
 * zero steps, which is why the fixture, not the corpus, pins this rule.
 * separate the pinned sets, because build-autoencoder (pinned known-good) and
 * load-pretrained-pipeline both carry 4 steps at 0.300 coverage, identical on
 * both signals. So the count is reported beside every score, in the
 * scoreboard and in the failure message, and decides nothing on its own.
 *
 * Two deliberate non-rules, both killed by measurement:
 *   - The longest verbatim run shared by comments and solution, unfiltered.
 *     The pinned known-good set runs up to 16 characters (" validationSplit"
 *     in training-loop-exercise) and the pinned known-bad set starts at 8
 *     (" backend" in tfjs-setup), so the bands overlap and no threshold
 *     works. Rule 3 is the same idea with the discriminating filter attached.
 *   - An aggravated coverage limit for starters that also carry steps. There
 *     is no room for one: see build-autoencoder above.
 *
 * MEASUREMENT NOTE. This module reads AUTHORED exercise YAML, not the Velite
 * build, so a starter edit is scored the moment it is saved. The round-6
 * audit table was computed over the compiled index with a different
 * tokenizer, so per-slug coverage differs where the answer set is small: it
 * read ci-cd-gate at 0.75 and browser-ml-tradeoffs at 0.17, this reads 0.333
 * (1 of 3) and 1.000 (1 of 1). The two agree on all 65 numbered-step counts
 * and on the shape of the finding. Where an answer set is under 5 tokens a
 * single word moves the score a long way, which is why the failure message
 * prints the tokens rather than the percentage alone.
 *
 * The vocabulary primitives (comment stripping, token extraction, the answer
 * set, call sites, the YAML field reader) are imported from
 * ./hint-dictation.mjs rather than copied, so "the vocabulary the learner has
 * to supply" means one thing across both dictation gates. Dependency-free
 * otherwise, so the CI report script and the Vitest gate share one
 * implementation instead of drifting apart.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  answerTokens,
  callSites,
  codeTokens,
  exerciseField,
  stripComments,
  builtWorldDirs,
} from "./hint-dictation.mjs";

export { builtWorldDirs };

/**
 * Rule 1 limit: the share of the answer vocabulary a starter's comments may
 * name.
 *
 * Measured on the authored corpus (2026-09-12, `node
 * scripts/report-starter-dictation.mjs`): the pinned known-good set tops out
 * at 0.300 and the pinned known-bad set starts at 0.333, an empty band with
 * nothing in it. Every limit from 0.300 to 0.333 returns the identical
 * verdict on all 65 starters, so this sits near the band's midpoint rather
 * than on either edge, where a one-token edit would flip a verdict. The band
 * is narrow because build-autoencoder, which is pinned as scaffolding, hands
 * over its layer sizes (8, 4, 2 and relu) and sits at 0.300. Re-measure the
 * band before moving the limit.
 */
export const COVERAGE_LIMIT = 0.32;

/**
 * Rule 3 minimum, in normalized characters. Measured: every minimum from 1 to
 * 13 returns the identical verdict on all 65 starters (the shortest quoted
 * expression in the corpus is predict-next's 13-character `/ scaler.std`), so
 * the value is not load-bearing today. It is set at 12 because a run shorter
 * than that cannot hold two identifiers and an operator without being a
 * coincidence.
 */
export const EXPRESSION_MIN_CHARS = 12;

/** Rule 3: two or more DISTINCT identifiers of this length or more. */
const EXPRESSION_ID = /[A-Za-z_$][A-Za-z0-9_$]{2,}/g;

/** Rule 3: what makes a run an expression rather than a name or a phrase. */
const EXPRESSION_OPERATOR = /(?:===|==|>=|<=|=>|[=<>+\-*/%])/;

/**
 * A numbered step line: "1. ", "2) ", "- 3: ". Counted as evidence and
 * stripped before tokenizing, never used as a trigger (see the header).
 */
export const STEP_ORDINAL = /^\s*(?:[-*]\s*)?\d+[.):]\s/;

/**
 * String and template literals are masked with this sentinel so a rule-3 run
 * can never straddle one. It is built with fromCharCode rather than written
 * as a literal control byte on purpose: a control byte in a tracked file
 * makes git treat the file as binary, which is exactly how the em-dash gate
 * went blind to 137 em dashes on 2026-09-08.
 */
const LITERAL_MASK = String.fromCharCode(1);

/**
 * The comment lines of a block of code, in order, comment markers removed.
 * String and template literals are respected, so a "//" inside a url is not
 * a comment. A JSDoc continuation star is trimmed, so `* 1. step` counts as a
 * numbered step.
 */
export function commentLines(source) {
  const src = source ?? "";
  const out = [];
  let i = 0;
  let quote = null;
  while (i < src.length) {
    const c = src[i];
    const d = src[i + 1];
    if (quote) {
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      i++;
      continue;
    }
    if (c === "/" && d === "/") {
      let j = i + 2;
      while (j < src.length && src[j] !== "\n") j++;
      out.push(src.slice(i + 2, j));
      i = j;
      continue;
    }
    if (c === "/" && d === "*") {
      let j = i + 2;
      while (j < src.length && !(src[j] === "*" && src[j + 1] === "/")) j++;
      out.push(...src.slice(i + 2, j).split("\n"));
      i = j + 2;
      continue;
    }
    i++;
  }
  return out.map((line) => line.replace(/^\s*\*\s?/, ""));
}

/** Every comment in a starter as one whitespace-collapsed string. */
export function commentText(source) {
  return commentLines(source).join(" ").replace(/\s+/g, " ").trim();
}

/** How many comment lines open with a step ordinal. Evidence, not a rule. */
export function numberedSteps(source) {
  return commentLines(source).filter((line) => STEP_ORDINAL.test(line)).length;
}

/**
 * Words and numbers a starter's comments name.
 *
 * Step ordinals are stripped first. Crediting them scored three outlines for
 * their punctuation: with the ordinals left in, build-spectrogram reads 0.053,
 * time-vs-frequency 0.067 and compute-fft 0.154, all of it the numbers 1, 2
 * and 3 matching array indices in the solution. None of the three names a
 * single identifier, and all three read 0.000 once the ordinals are gone,
 * which is what an outline should score.
 */
export function commentTokens(source) {
  const out = new Set();
  const text = commentLines(source)
    .map((line) => line.replace(STEP_ORDINAL, " "))
    .join("\n");
  for (const m of text.matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g))
    out.add(m[0].toLowerCase());
  for (const m of text.matchAll(/\d+(?:\.\d+)?/g)) out.add(m[0]);
  return out;
}

/** True when a starter comment says the word out loud. */
export function namesRecipe(source) {
  return /\brecipes?\b/i.test(commentText(source));
}

/** Solution code with comments removed and every string body masked. */
export function maskedSolution(solutionCode) {
  const src = stripComments(solutionCode ?? "");
  let out = "";
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      out += LITERAL_MASK;
      i++;
      while (i < src.length && src[i] !== c) {
        if (src[i] === "\\") i++;
        i++;
      }
      i++;
      continue;
    }
    out += c;
    i++;
  }
  return out.replace(/\s+/g, " ").trim();
}

function isQuotedExpression(run) {
  if (run.includes(LITERAL_MASK)) return false;
  if (!EXPRESSION_OPERATOR.test(run)) return false;
  const ids = [...run.matchAll(EXPRESSION_ID)].map((m) => m[0]);
  return new Set(ids).size >= 2;
}

/**
 * The longest run of solution code the starter's comments quote verbatim that
 * reads as an expression: a binary operator and two or more distinct
 * identifiers, no string body inside it. Returns "" when there is none.
 *
 * Longest-common-substring by dynamic programming over the two normalized
 * strings. The corpus strings are short (comments under 2 KB, solutions under
 * 5 KB) and the whole 65-starter sweep measures at 0.19s wall clock.
 */
export function quotedExpression(source, solutionCode) {
  const a = commentText(source);
  const b = maskedSolution(solutionCode);
  if (!a || !b) return "";
  let best = "";
  const prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let carry = 0;
    for (let j = 1; j <= b.length; j++) {
      const cur = a[i - 1] === b[j - 1] ? carry + 1 : 0;
      carry = prev[j];
      prev[j] = cur;
      if (cur <= best.length) continue;
      for (let len = cur; len > best.length; len--) {
        const run = a.slice(i - len, i);
        if (isQuotedExpression(run)) {
          best = run;
          break;
        }
      }
    }
  }
  return best.length >= EXPRESSION_MIN_CHARS ? best.trim() : "";
}

/**
 * Score one starter. Returns the numbers all four flags are decided on, so a
 * caller can print the evidence rather than a verdict.
 */
export function scoreStarter(exercise) {
  const starter = exercise.starterCode ?? "";
  const solution = exercise.solutionCode ?? "";
  const answers = answerTokens(solution, starter);
  const answerSet = new Set(answers);
  const named = commentTokens(starter);
  const namedAnswers = answers.filter((t) => named.has(t));
  const coverage = answers.length ? namedAnswers.length / answers.length : 0;
  // A quoted call site only counts when the call is part of the ANSWER, the
  // same exemption the hint gate needed: a comment may repeat a call the
  // starter already declares without adding anything.
  const comments = commentText(starter);
  const quotedCallSites = callSites(solution).filter(
    (site) =>
      comments.includes(site) &&
      [...codeTokens(site)].some((t) => answerSet.has(t)),
  );
  const expression = quotedExpression(starter, solution);
  const recipe = namesRecipe(starter);
  return {
    answerCount: answers.length,
    namedAnswers,
    coverage,
    numberedSteps: numberedSteps(starter),
    quotedCallSites,
    quotedExpression: expression,
    namesRecipe: recipe,
    dictates:
      (answers.length > 0 && coverage > COVERAGE_LIMIT) ||
      quotedCallSites.length > 0 ||
      expression.length > 0 ||
      recipe,
  };
}

/* ------------------------------------------------------------------ *
 * Source reader. Reads AUTHORED exercise YAML so a starter edit is
 * scored the moment it is saved, with no build step in between.
 * ------------------------------------------------------------------ */

/**
 * Every exercise in the given worlds, with its starter and solution.
 *
 * The unit is the EXERCISE, not the (hint, exercise) pair the guidance gate
 * scores: a starter belongs to exactly one exercise, so the directory walk is
 * the whole discovery. A slug whose YAML stops matching the field reader
 * silently scores 0 and passes, which is why the gate pins both the count and
 * the non-emptiness of every starter it found.
 */
export function collectStarterCases(contentRoot, worldDirs) {
  const cases = [];
  for (const world of worldDirs) {
    const worldPath = join(contentRoot, world);
    if (!existsSync(worldPath)) continue;
    for (const moduleDir of readdirSync(worldPath, { withFileTypes: true })) {
      if (!moduleDir.isDirectory()) continue;
      const exercisesPath = join(worldPath, moduleDir.name, "exercises");
      if (!existsSync(exercisesPath)) continue;
      for (const entry of readdirSync(exercisesPath).sort()) {
        if (!entry.endsWith(".yaml")) continue;
        const file = join(exercisesPath, entry);
        const raw = readFileSync(file, "utf8");
        const slug = entry.replace(/\.yaml$/, "");
        cases.push({
          id: `${world}/${moduleDir.name}::${slug}`,
          slug,
          world,
          module: moduleDir.name,
          file,
          starterCode: exerciseField(raw, "starterCode", "solutionCode"),
          solutionCode: exerciseField(raw, "solutionCode", "testCode"),
        });
      }
    }
  }
  return cases;
}
