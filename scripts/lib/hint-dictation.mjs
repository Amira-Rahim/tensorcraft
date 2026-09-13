/**
 * Guidance-rung dictation metric (audit round 5, 2026-09-08).
 *
 * WHY THIS EXISTS. The repo gates the SOLUTION rung of the hint ladder
 * (packages/content/__tests__/metadata-consistency.test.ts Gate B: a solution
 * hint must be a verbatim whitespace-normalized excerpt of solutionCode) and,
 * before today, gated nothing at all on the nudge and guidance rungs. A
 * repo-wide grep for a test touching either returned nothing. In this repo
 * what is not gated drifts, and the guidance rung drifted all the way into
 * dictation: on 2026-09-08 a submission built from nothing but the
 * guidance-level hint passed every shipped test in 55 of 65 exercises. The
 * middle rung was not a hint, it was the answer.
 *
 * "Is this a hint or an answer" is not directly computable, so this module
 * measures two things that are, both calibrated against the 10 exercises
 * whose guidance hints DID hold under that verification (9 of the 10 are the
 * supplementary incident-* drills, whose lesson ladder targets a different
 * exercise, plus batch-data).
 *
 *   RULE 1, COVERAGE. Answer tokens are the identifiers (3 characters or
 *   more) and numeric literals that solutionCode uses and starterCode does
 *   not: exactly the vocabulary the learner has to supply. A guidance hint
 *   may name at most 40% of them. Measured on the authored corpus
 *   (2026-09-08): coverage is bimodal, the 13 passing hints top out at 0.333
 *   and the 52 flagged ones start at 0.467, so the limit sits in the middle
 *   of a measured empty band and every threshold from 0.34 to 0.46 returns
 *   the identical verdict on all 65 exercises. Case is folded before
 *   matching, so capitalising a name does not dodge the rule.
 *
 *   RULE 2, QUOTED CALL SITE. A guidance hint may not contain, verbatim, an
 *   answer call site out of solutionCode with its argument list filled in
 *   (`.shuffle(10).batch(4)`, `tf.tensor2d([normalized])`). Naming an API is
 *   teaching. Handing over the call with its arguments is transcription.
 *   Measured: 0 of the 13 passing hints quote one, 31 of the 52 flagged ones
 *   do. Rule 2 flags a subset of Rule 1 today, and it is kept because it
 *   catches the case Rule 1 cannot see: a pasted line that reuses only
 *   identifiers the starter already declared, which scores no coverage at all.
 *   A call whose every token comes from the starter does NOT count, or a hint
 *   would trip for repeating a helper the exercise handed the learner
 *   (measured false positive: model-pipeline, whose starter declares both
 *   `classify` and `signal`).
 *
 * Deliberately NOT used, because measurement said it does not discriminate:
 * the longest verbatim run shared by hint and solution. The passing hints run
 * up to 15 characters (" reconstruction", part of one identifier) and the
 * flagged ones start at 13, so the bands overlap and any threshold either
 * misses real dictations or punishes a hint for naming a long identifier.
 *
 * Dependency-free by design (mirrors scripts/validate-exercises.mjs) so both
 * the CI report script and the Vitest gate in packages/content can share one
 * implementation instead of drifting apart.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Rule 1 limit: the share of the answer vocabulary a guidance hint may name.
 *
 * Measured on the authored corpus (2026-09-08, `node
 * scripts/report-hint-dictation.mjs`): coverage is bimodal, with an empty
 * band from 0.333 to 0.467 and nothing in between. Every limit inside that
 * band returns the identical verdict on all 65 exercises, so this sits at the
 * band's midpoint rather than on either edge, where a one-token edit would
 * flip a verdict. Re-measure the band before moving it.
 */
export const COVERAGE_LIMIT = 0.4;

/** Rule 2 minimum call-site length, in normalized characters. */
export const CALL_SITE_MIN_CHARS = 8;

/** Rule 1 minimum identifier length. `i`, `j`, `t`, `q` are loop and scratch
 *  names that collide with ordinary prose, not answers. */
export const TOKEN_MIN_CHARS = 3;

const KEYWORDS = new Set(
  (
    "const let var function return if else for while of in new await async " +
    "yield true false null undefined class this typeof delete void do switch " +
    "case break continue try catch finally throw extends super import export " +
    "from default instanceof"
  )
    .split(" ")
    .filter(Boolean),
);

/**
 * Strip comments while respecting string and template literals, so a url in
 * a string ("https://host/model.json") does not lose its tail to the line
 * comment rule. Regex literals are not tracked: no exercise solution in the
 * corpus carries one that contains a comment opener.
 */
export function stripComments(source) {
  let out = "";
  let i = 0;
  let quote = null;
  while (i < source.length) {
    const c = source[i];
    const d = source[i + 1];
    if (quote) {
      out += c;
      if (c === "\\") {
        out += d ?? "";
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      out += c;
      i++;
      continue;
    }
    if (c === "/" && d === "/") {
      while (i < source.length && source[i] !== "\n") i++;
      out += " ";
      continue;
    }
    if (c === "/" && d === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/"))
        i++;
      i += 2;
      out += " ";
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Comment-free, whitespace-collapsed code. Same vocabulary as the
 *  validator's normalizeCode, so comparisons across the two gates mean the
 *  same thing. */
export function normalizeCode(source) {
  return stripComments(source ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Identifiers and numeric literals in a block of CODE. */
export function codeTokens(source) {
  const out = new Set();
  const clean = stripComments(source ?? "");
  for (const m of clean.matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)) {
    if (m[0].length < TOKEN_MIN_CHARS) continue;
    if (KEYWORDS.has(m[0])) continue;
    out.add(m[0].toLowerCase());
  }
  for (const m of clean.matchAll(/\d+(?:\.\d+)?/g)) out.add(m[0]);
  return out;
}

/** Words and numbers in a block of PROSE (a hint). No comment stripping:
 *  every word of a hint is visible to the learner. */
export function proseTokens(text) {
  const out = new Set();
  for (const m of (text ?? "").matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g))
    out.add(m[0].toLowerCase());
  for (const m of (text ?? "").matchAll(/\d+(?:\.\d+)?/g)) out.add(m[0]);
  return out;
}

/**
 * The vocabulary the learner must supply: what solutionCode uses and
 * starterCode does not. Starter comments are stripped on purpose. A starter
 * comment that already names the call ("// await dataset.forEachAsync(...)")
 * is a separate scaffolding decision; it does not license the hint to hand
 * the same call over again, and crediting it collapsed the metric when
 * measured (the answer sets fell to 0 to 5 tokens and the score stopped
 * separating the known-good hints from the dictations).
 */
export function answerTokens(solutionCode, starterCode) {
  const given = codeTokens(starterCode);
  return [...codeTokens(solutionCode)].filter((t) => !given.has(t)).sort();
}

/**
 * Argument-bearing call sites in a block of code, normalized. Callee is the
 * member chain immediately left of the paren, so both `tf.tensor2d([x])` and
 * the chained `.batch(4)` tail are reported.
 */
export function callSites(source) {
  const s = normalizeCode(source);
  const out = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== "(") continue;
    let j = i - 1;
    if (j < 0 || !/[A-Za-z0-9_$.]/.test(s[j])) continue;
    while (j >= 0 && /[A-Za-z0-9_$.]/.test(s[j])) j--;
    const callee = s.slice(j + 1, i);
    if (!callee || !/^[A-Za-z_$.]/.test(callee)) continue;
    if (KEYWORDS.has(callee.split(".")[0])) continue;
    let depth = 0;
    let k = i;
    for (; k < s.length; k++) {
      if (s[k] === "(") depth++;
      else if (s[k] === ")") {
        depth--;
        if (!depth) break;
      }
    }
    if (depth !== 0) continue;
    const args = s.slice(i + 1, k);
    if (!args.trim()) continue;
    const site = `${callee}(${args})`;
    if (site.length < CALL_SITE_MIN_CHARS) continue;
    out.push(site);
  }
  return [...new Set(out)];
}

/**
 * Score one guidance hint against one exercise.
 * Returns the numbers both rules are decided on, so a caller can print the
 * evidence rather than a verdict.
 */
export function scoreHint(hint, exercise) {
  const answers = answerTokens(exercise.solutionCode, exercise.starterCode);
  const answerSet = new Set(answers);
  const named = new Set(proseTokens(hint));
  const namedAnswers = answers.filter((t) => named.has(t));
  const normalizedHint = normalizeCode(hint);
  // A quoted call site only counts when the call is part of the ANSWER. A
  // hint may freely repeat a call the starter already declares: model-pipeline
  // hands the learner `classify` and `signal` as parameters, so its hint
  // saying "Await classify(signal)" adds nothing, and counting it was a
  // measured false positive (2026-09-08).
  const quoted = callSites(exercise.solutionCode).filter(
    (site) =>
      normalizedHint.includes(site) &&
      [...codeTokens(site)].some((t) => answerSet.has(t)),
  );
  return {
    answerCount: answers.length,
    namedAnswers,
    coverage: answers.length ? namedAnswers.length / answers.length : 0,
    quotedCallSites: quoted,
    dictates:
      (answers.length > 0 &&
        namedAnswers.length / answers.length > COVERAGE_LIMIT) ||
      quoted.length > 0,
  };
}

/* ------------------------------------------------------------------ *
 * Source readers. Both gates read AUTHORED files, not the Velite
 * build, so a hint edit is measured the moment it is saved.
 * ------------------------------------------------------------------ */

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/;

export function frontmatter(source) {
  return source.match(FRONTMATTER)?.[1] ?? "";
}

export function bodyOf(source) {
  const fm = source.match(FRONTMATTER);
  return fm ? source.slice(fm[0].length) : source;
}

function unescapeDoubleQuoted(value) {
  return value.replace(/\\(["\\nt])/g, (_, c) =>
    c === "n" ? "\n" : c === "t" ? "\t" : c,
  );
}

/**
 * One rung out of a lesson's hint ladder. Both authored YAML shapes are
 * accepted: single-line double-quoted (all 56 guidance hints at HEAD) and
 * block scalar (the shape Gate B's solution hints use, and the shape a
 * multi-line rewrite will reach for). A shape neither branch matches drops
 * the case out of discovery, which is what the count pin in the gate is for.
 */
export function hintAtLevel(fm, level) {
  const quoted = fm.match(
    new RegExp(
      `^ {2}- level: ${level}\\n {4}content:\\s*"([\\s\\S]*?)"\\n(?= {2}[-\\w]|\\w)`,
      "m",
    ),
  );
  if (quoted) return unescapeDoubleQuoted(quoted[1]);
  const block = fm.match(
    new RegExp(
      `^ {2}- level: ${level}\\n {4}content: \\|-?\\n((?: {6}.*\\n?|\\n)+)`,
      "m",
    ),
  );
  if (block) return block[1].replace(/^ {6}/gm, "").trimEnd();
  return null;
}

/** A block or double-quoted scalar field out of an exercise YAML. */
export function exerciseField(raw, field, nextField) {
  const chunk =
    raw.match(new RegExp(`^${field}:[\\s\\S]*?(?=^${nextField}:)`, "m"))?.[0] ??
    "";
  if (!chunk.trim()) return "";
  if (new RegExp(`^${field}:\\s*"`).test(chunk)) {
    return unescapeDoubleQuoted(
      chunk.replace(new RegExp(`^${field}:\\s*"`), "").replace(/"\s*$/, ""),
    );
  }
  return chunk.replace(new RegExp(`^${field}:\\s*\\|-?\\n?`), "");
}

/** Lesson .mdx files under one world dir, sorted. */
export function lessonFilesFor(contentRoot, worldDir) {
  const world = join(contentRoot, worldDir);
  if (!existsSync(world)) return [];
  const out = [];
  for (const moduleDir of readdirSync(world, { withFileTypes: true })) {
    if (!moduleDir.isDirectory()) continue;
    const modulePath = join(world, moduleDir.name);
    for (const entry of readdirSync(modulePath, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".mdx"))
        out.push(join(modulePath, entry.name));
    }
  }
  return out.sort();
}

/**
 * Every (lesson guidance hint, exercise) pair in the given worlds.
 *
 * The pair is the unit of judgement, not the lesson: 8 launched lessons carry
 * two or three exercises, and a ladder written for the first one legitimately
 * says nothing about the incident-* drill beside it. Scoring per pair says
 * WHICH exercise a hint hands over, and lets the drill pass on its own merits.
 */
export function collectGuidanceCases(contentRoot, worldDirs) {
  const cases = [];
  for (const world of worldDirs) {
    for (const file of lessonFilesFor(contentRoot, world)) {
      const source = readFileSync(file, "utf8");
      const fm = frontmatter(source);
      const hint = hintAtLevel(fm, "guidance");
      const lessonId = relative(contentRoot, file).replace(/\.mdx$/, "");
      const slugs = [
        ...new Set(
          [...bodyOf(source).matchAll(/<Exercise\s+slug="([^"]+)"/g)].map(
            (m) => m[1],
          ),
        ),
      ];
      for (const slug of slugs) {
        const path = join(file, "..", "exercises", `${slug}.yaml`);
        if (!existsSync(path)) continue;
        const raw = readFileSync(path, "utf8");
        cases.push({
          id: `${lessonId}::${slug}`,
          lessonFile: file,
          lessonId,
          slug,
          exerciseFile: path,
          hint,
          exercise: {
            starterCode: exerciseField(raw, "starterCode", "solutionCode"),
            solutionCode: exerciseField(raw, "solutionCode", "testCode"),
          },
        });
      }
    }
  }
  return cases;
}

/** BUILT_WORLD_DIRS, read out of the one TypeScript constant that owns it so
 *  a CLI with no TS toolchain still tracks the build. */
export function builtWorldDirs(repoRoot) {
  const src = readFileSync(
    join(repoRoot, "packages/content/src/built-worlds.ts"),
    "utf8",
  );
  const list = src.match(/BUILT_WORLD_DIRS = \[([^\]]*)\]/)?.[1];
  if (!list) {
    throw new Error(
      "hint-dictation: BUILT_WORLD_DIRS not found in packages/content/src/built-worlds.ts",
    );
  }
  return [...list.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}
