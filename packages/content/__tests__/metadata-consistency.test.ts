import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import ts from "typescript";
import { BUILT_WORLD_DIRS } from "../src/built-worlds";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import {
  CONTENT_DIR,
  lessonFiles,
} from "../../../scripts/audit-structure-variety.mjs";

/**
 * Metadata-vs-body consistency gates (audit run #6, 2026-07-15).
 *
 * Six audit rounds read lesson *bodies*. Nobody had read the layer that
 * *summarises* the bodies against them. That round found ~11 defects there,
 * all sharing one root cause: a field was rewritten and its siblings were
 * not. Epilogues gained failure per the style bible's stakes rule while the
 * loglines above them still described the tidy successes of an earlier
 * draft; exercises were rewritten while the hints pointing at them were not.
 *
 * Audits do not converge on this class - fix waves reintroduce it at roughly
 * the rate they remove it. These three gates do, because each one is a
 * mechanical consequence of the defect rather than a reading of it.
 *
 * Each gate below was calibrated against the full 77-lesson corpus and
 * tuned to zero false positives (bar the single allowlisted case). A gate
 * that fires on correct lessons gets muted within a week and protects
 * nothing, so any future widening MUST be re-calibrated the same way.
 */

/**
 * `CONTENT_DIR` from audit-structure-variety.mjs is hardcoded to deep-orbit,
 * so every gate built on it is blind to `extras/`. That blindness is not
 * theoretical: it is why 3 em dashes survived the app-wide sweep in extras,
 * and why run #6 was the first to notice that extras/math-deep-dive defines
 * cross-entropy as KL divergence.
 *
 * Velite ships `{deep-orbit,extras}` (velite.config.ts LAUNCHED_WORLD_DIRS).
 * Anything a customer can load, these gates check.
 */
const CONTENT_ROOT = dirname(CONTENT_DIR);
// Scope tracks the build via one shared constant (F3). Adding a launched
// world to BUILT_WORLD_DIRS extends this gate automatically.
const LAUNCHED_WORLD_DIRS = [...BUILT_WORLD_DIRS];

function launchedLessonFiles(): string[] {
  return LAUNCHED_WORLD_DIRS.flatMap((world) =>
    lessonFiles(join(CONTENT_ROOT, world)),
  );
}

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/;

function frontmatter(source: string): string {
  return source.match(FRONTMATTER)?.[1] ?? "";
}

function body(source: string): string {
  const fm = source.match(FRONTMATTER);
  return fm ? source.slice(fm[0].length) : source;
}

function lessonId(file: string): string {
  return relative(CONTENT_ROOT, file).replace(/\.mdx$/, "");
}

/* ------------------------------------------------------------------ *
 * Gate A - numbers asserted in consequence.narrative must be earned
 * ------------------------------------------------------------------ */

/**
 * `consequence.narrative` is the closing logline. When it quotes a
 * measurement, that measurement has to exist on the page the learner then
 * reads - otherwise the course cites a number it never produced, and later
 * lessons compute against a baseline that was only ever asserted in
 * frontmatter (optimization-edge/05 derived "9x faster" from a phantom
 * 45 ms).
 *
 * Only unit-bearing numbers are checked. Bare integers are prose ("five
 * components", "sixty-four channels") and version strings ("DEEP SCAN 2.0")
 * are names, not claims; including either produced false positives.
 */
const UNIT_NUMBER = /\b(\d[\d,]*(?:\.\d+)?)\s*(%|MB|GB|ms|x|lines)\b/gi;

/**
 * Prose spells small numbers ("the classifier runs in twelve lines"), so a
 * digits-only search reports the logline as unearned when the scene states
 * the figure perfectly well. browser-runtimes/06 was exactly this false
 * positive. Only the range that actually shows up spelled out is mapped;
 * nobody writes "three hundred and forty megabytes".
 */
const NUMBER_WORDS: Record<string, string> = {
  "1": "one",
  "2": "two",
  "3": "three",
  "4": "four",
  "5": "five",
  "6": "six",
  "7": "seven",
  "8": "eight",
  "9": "nine",
  "10": "ten",
  "11": "eleven",
  "12": "twelve",
  "13": "thirteen",
  "14": "fourteen",
  "15": "fifteen",
  "16": "sixteen",
  "17": "seventeen",
  "18": "eighteen",
  "19": "nineteen",
  "20": "twenty",
};

describe("consequence.narrative numbers appear in the lesson body", () => {
  const cases = launchedLessonFiles().map((file: string) => {
    const source = readFileSync(file, "utf8");
    const narrative =
      frontmatter(source).match(
        /^consequence:\n\s+narrative:\s*"(.*)"$/m,
      )?.[1] ?? "";
    return { id: lessonId(file), narrative, text: body(source) };
  });

  it.each(cases.filter((c: { narrative: string }) => c.narrative))(
    "$id",
    ({
      id,
      narrative,
      text,
    }: {
      id: string;
      narrative: string;
      text: string;
    }) => {
      // Commas are stripped so "28,800" in the narrative matches "28800" or
      // "28,800" in the body; the body is searched on word boundaries so
      // "45" never matches "450".
      const haystack = text.replace(/,/g, "");
      const missing: string[] = [];

      for (const [full, digits, unit] of narrative.matchAll(UNIT_NUMBER)) {
        const n = digits.replace(/,/g, "");
        const escaped = n.replace(".", "\\.");
        // A percentage must appear AS a percentage. `80` alone matched an
        // unrelated input shape `[80, 11]` during calibration, which let the
        // real "80% of the time in the first Dense layer" defect through.
        // A trailing \b cannot be used here: in "1.4x baseline" the boundary
        // between "4" and "x" does not exist, so \b1\.4\b never matches a
        // figure the body states plainly. Assert instead that the number is
        // not the prefix of a LARGER number, so "45" still refuses to match
        // "450" while matching "45ms", "45 ms" and "1.4x".
        const pattern =
          unit === "%"
            ? new RegExp(`\\b${escaped}\\s*(?:%|percent)`)
            : new RegExp(`\\b${escaped}(?![\\d.])`);
        if (pattern.test(haystack)) continue;

        const word = NUMBER_WORDS[n];
        if (word && new RegExp(`\\b${word}\\b`, "i").test(haystack)) continue;

        missing.push(full.trim());
      }

      expect(
        missing,
        `${id}: consequence.narrative asserts ${missing.join(
          ", ",
        )} but the body never produces that figure. Either the scene lost the ` +
          `number or the logline is from an earlier draft.`,
      ).toEqual([]);
    },
  );
});

/* ------------------------------------------------------------------ *
 * Gate B - a solution hint must be a verbatim excerpt of the solution
 * ------------------------------------------------------------------ */

/**
 * The `solution`-level hint is the last thing a stuck learner reveals. Run #6
 * gated it on vocabulary overlap; run #7 executed all 77 ladders against
 * their graders and proved that gate far too weak: 38 revealed solution
 * hints failed their own exercise (9 actively wrong, 27 prose-only against
 * code graders, incl. the entire capstone), and vocabulary overlap caught
 * almost none of them because a stale hint still shares words with the
 * exercise it used to describe.
 *
 * The durable convention, enforced here: A SOLUTION HINT IS AN EXCERPT.
 * Every substantive fragment of it must appear verbatim (whitespace-
 * normalized) inside the exercise's own `solutionCode`. Combined with the
 * existing grader gate (`pnpm test:exercises` proves every solutionCode
 * passes its tests), this makes a wrong solution hint unrepresentable:
 * hint ⊂ solution ∧ solution passes ⇒ the hint's code is correct code.
 * Rewrite the exercise and forget the hint, and this gate goes red.
 *
 * Prose is banned at the solution level - that is what nudge/guidance are
 * for. Fragments under 12 normalized characters are ignored (connectors,
 * step numerals); everything longer must be found in solutionCode.
 *
 * HARDENED 2026-07-25 (fresh-eyes rerun §5/§6, T0-9 + T1-19). The previous
 * version of this gate split hint fragments on `;` - the exact character
 * that newline→`; ` flattening corruption introduces - so 15 of 77 hints
 * carried artifacts like `{;` and `,;` under a green gate, 2 of them hard
 * syntax errors if pasted. Four layers now make that class unrepresentable:
 *
 *   1. PARSE: every solution hint must transpile with zero syntactic
 *      diagnostics (wrapped in an async generator body, since hints are
 *      statement fragments that may use await/yield/return).
 *   2. ARTIFACTS: `,;` and `{;` are asserted absent outright. They are the
 *      two flattening signatures the parser cannot be the authority on -
 *      `{;` parses as block + empty statement, and `,;` only errors in some
 *      positions. All other signatures (`(;`, `; .method`, `; )`) ARE parse
 *      errors, so layer 1 is their authority. `};` is deliberately NOT
 *      banned: it is legal at the end of every object-literal assignment;
 *      a stray one is caught by layer 3 instead.
 *   3. INCLUSION: fragments are the hint's top-level STATEMENTS as the
 *      TypeScript parser sees them - never a split on raw `;` - so an
 *      interpolated delimiter stays inside its statement's text and fails
 *      the verbatim-excerpt match against solutionCode.
 *   4. COUNT PIN: the suite must discover exactly EXPECTED_SOLUTION_HINTS
 *      cases, so a hint edit that silently drops a case out of discovery
 *      (malformed YAML, renamed exercise) goes red instead of green.
 */

/** Collapse whitespace so YAML block-scalar vs single-line quoting differences never matter. */
function normalizeCode(code: string): string {
  return code.replace(/\s+/g, " ").trim();
}

/**
 * Undo YAML double-quote escaping left-to-right, so `\\n` in the source
 * becomes a literal `\n` sequence rather than a newline (a right-to-left
 * chain of .replace calls gets that case wrong).
 */
function unescapeDoubleQuoted(scalar: string): string {
  return scalar.replace(/\\(.)/g, (_, c: string) =>
    c === "n" ? "\n" : c === "t" ? "\t" : c,
  );
}

/**
 * The solution hint out of a lesson's frontmatter. Two YAML shapes exist:
 * single-line double-quoted (the original convention) and block scalar
 * (restored 2026-07-25 for the 15 hints whose newlines had been flattened
 * into `; ` corruption - and for any future multi-line excerpt).
 */
function solutionHint(fm: string): string | null {
  const quoted = fm.match(
    /^ {2}- level: solution\n {4}content:\s*"([\s\S]*?)"\n(?= {2}[-\w]|\w)/m,
  );
  if (quoted) return unescapeDoubleQuoted(quoted[1]);
  const block = fm.match(
    /^ {2}- level: solution\n {4}content: \|-?\n((?: {6}.*\n?|\n)+)/m,
  );
  if (block) return block[1].replace(/^ {6}/gm, "").trimEnd();
  return null;
}

/**
 * The decoded solutionCode of one exercise YAML. The raw file text is NOT
 * comparable: 26 of 85 exercises use double-quoted scalars whose `\n` is a
 * two-character escape, and a multi-line hint statement (a for-loop body)
 * can never match across a literal backslash-n. Decoding first makes the
 * whitespace-normalized comparison honest for both YAML styles.
 */
function exerciseSolution(path: string): string {
  const raw =
    readFileSync(path, "utf8").match(
      /^solutionCode:[\s\S]*?(?=^testCode:)/m,
    )?.[0] ?? "";
  if (!raw.trim()) return "";
  if (/^solutionCode:\s*"/.test(raw)) {
    return unescapeDoubleQuoted(
      raw.replace(/^solutionCode:\s*"/, "").replace(/"\s*$/, ""),
    );
  }
  return raw.replace(/^solutionCode:\s*\|-?\n?/, "");
}

/**
 * Hints are statement fragments, not modules: they may use `await`, `yield`
 * (data pipelines excerpt generator bodies) and bare `return`, so they are
 * wrapped in an async generator body before parsing. transpileModule
 * reports SYNTACTIC diagnostics only, which is exactly right here: a hint
 * stitching excerpts from two functions legitimately redeclares a const
 * (semantic), but `,;` inside an object literal (syntactic) must fail.
 */
function wrapHint(hint: string): string {
  return `async function* __hint__() {\n${hint}\n}`;
}

function hintParseDiagnostics(hint: string): string[] {
  const result = ts.transpileModule(wrapHint(hint), {
    compilerOptions: { target: ts.ScriptTarget.ES2020 },
    reportDiagnostics: true,
  });
  return (result.diagnostics ?? []).map((d) =>
    ts.flattenDiagnosticMessageText(d.messageText, " "),
  );
}

/**
 * The hint's top-level statements, by the parser's reckoning. This is the
 * fragment set for the inclusion check - splitting on raw `;` is exactly
 * the delimiter blindness that hid the flattening corruption, because the
 * corruption character became a fragment boundary and vanished. A statement
 * keeps every character between its start and end, so a stray `;` inside a
 * for-loop stays in the fragment and fails the verbatim match.
 */
function hintStatements(hint: string): string[] {
  const wrapped = wrapHint(hint);
  const sf = ts.createSourceFile(
    "hint.ts",
    wrapped,
    ts.ScriptTarget.ES2020,
    true,
  );
  const fn = sf.statements[0];
  if (!fn || !ts.isFunctionDeclaration(fn) || !fn.body) return [];
  return fn.body.statements
    .filter((st) => !ts.isEmptyStatement(st))
    .map((st) => wrapped.slice(st.getStart(sf), st.end));
}

/**
 * Count pin (T1-19d). 77 = every launched lesson that ships a 3-level
 * ladder. Adding a lesson with a ladder legitimately raises this; anything
 * else that moves it means a hint silently fell out of discovery.
 */
// 77 -> 79 (2026-07-27): math-deep-dive gained statistics-of-signals and
// eigenvectors-svd-compression, each with a solution ladder.
const EXPECTED_SOLUTION_HINTS = 79;

/**
 * Flattening signatures the parser cannot rule on (see layer 2 above).
 * Calibrated against all 77 hints: zero false positives; present in the 15
 * corrupted hints found on 2026-07-25 before their restoration.
 */
const FLATTENING_ARTIFACTS = /,;|\{;/;

describe("solution hints are verbatim excerpts of their exercise's solutionCode", () => {
  const cases: {
    id: string;
    hint: string;
    solutions: string[];
  }[] = [];

  for (const file of launchedLessonFiles()) {
    const source = readFileSync(file, "utf8");
    const hint = solutionHint(frontmatter(source));
    if (!hint) continue;

    // The ladder targets ONE of the lesson's exercises. Usually the first,
    // but a multi-exercise finale may ladder the hardest instead (run #8:
    // capstone/05 ladders classify-anomaly, its third exercise), so the
    // hint must match SOME single exercise's solutionCode. incident-*
    // drills are supplementary and carry their own recipe in
    // instructions/starter.
    const slugs = [...source.matchAll(/<Exercise\s+slug="([^"]+)"/g)]
      .map((m) => m[1])
      .filter((s) => !s.startsWith("incident-"));
    if (slugs.length === 0) continue;

    const solutions = slugs.flatMap((slug) => {
      const path = join(dirname(file), "exercises", `${slug}.yaml`);
      if (!existsSync(path)) return [];
      const solution = exerciseSolution(path);
      return solution.trim() ? [solution] : [];
    });
    if (solutions.length === 0) continue;
    cases.push({
      id: `${lessonId(file)}::${slugs.join("+")}`,
      hint,
      solutions,
    });
  }

  it(`discovers exactly ${EXPECTED_SOLUTION_HINTS} solution-hint cases (count pin)`, () => {
    // A hint edit that malforms the YAML, or an exercise rename that breaks
    // the slug -> file mapping, silently DROPS a case from this suite - and
    // a dropped case is a hint nobody is checking. Raise the constant only
    // when a lesson legitimately gains or loses a solution ladder.
    expect(cases.length).toBe(EXPECTED_SOLUTION_HINTS);
  });

  it("capstone finale hint declares the four identifiers its excerpt references (Run-8 regression)", () => {
    // Run #8's capstone retarget shipped a solution hint whose excerpt used
    // mean, variance, ratios and fibonacciTrain without ever declaring
    // them - on the last lesson of the only purchasable world, under a
    // green gate (fresh-eyes rerun 2026-07-25, §5 regression 1). The three
    // statements below declare all four. The parse check cannot see a
    // missing declaration (undeclared identifiers are semantic), so the
    // specific repaired hint is pinned here.
    const finale = launchedLessonFiles().find((f: string) =>
      f.endsWith(join("deep-orbit", "capstone", "05-launch.mdx")),
    );
    expect(finale).toBeDefined();
    const hint = normalizeCode(
      solutionHint(frontmatter(readFileSync(finale as string, "utf8"))) ?? "",
    );
    for (const declaration of [
      "const { mean, variance } = tf.tidy(", // declares mean + variance
      "const ratios = decomposeIntervals(reading.intervals);",
      "const fibonacciTrain = isFibonacciTrain(ratios);",
    ]) {
      expect(hint).toContain(declaration);
    }
  });

  it.each(cases)(
    "$id",
    ({
      id,
      hint,
      solutions,
    }: {
      id: string;
      hint: string;
      solutions: string[];
    }) => {
      // Layer 2 - flattening artifacts the parser cannot rule on. `,;` and
      // `{;` only ever appear when a newline was collapsed into `; `.
      expect(
        FLATTENING_ARTIFACTS.test(hint),
        `${id}: the solution hint contains a newline-flattening artifact ` +
          `(",;" or "{;"). This is what a multi-line excerpt looks like ` +
          `after its newlines were collapsed into "; ". Restore the hint ` +
          `as a block scalar (content: |) copied verbatim from solutionCode.`,
      ).toBe(false);

      // Layer 1 - the hint must be pasteable code. Statement fragments are
      // legal; syntax errors are not.
      const diagnostics = hintParseDiagnostics(hint);
      expect(
        diagnostics,
        `${id}: the solution hint does not parse as TypeScript: ` +
          `${diagnostics.join(" | ")}. A stuck learner pastes this hint ` +
          `verbatim - it must at minimum be syntactically valid.`,
      ).toEqual([]);

      // Layer 3 - fragments are top-level statements per the parser.
      const fragments = hintStatements(hint)
        .map((f) => normalizeCode(f))
        .filter((f) => f.length >= 12);

      expect(
        fragments.length,
        `${id}: the solution hint contains no substantive fragment at all. ` +
          `Solution hints must be code excerpts from the exercise's ` +
          `solutionCode, not prose - prose belongs in nudge/guidance.`,
      ).toBeGreaterThan(0);

      // Every fragment must come from ONE exercise's solutionCode; report
      // the closest match's leftovers when none fits fully.
      const foreignPerSolution = solutions.map((solution) => {
        const normalizedSolution = normalizeCode(solution);
        return fragments.filter((f) => !normalizedSolution.includes(f));
      });
      const foreign = foreignPerSolution.reduce((best, current) =>
        current.length < best.length ? current : best,
      );

      expect(
        foreign,
        `${id}: these hint fragments do not appear in any single exercise's ` +
          `solutionCode: ${foreign
            .map((f) => JSON.stringify(f.slice(0, 60)))
            .join(" | ")}. A solution hint must be a verbatim excerpt of the ` +
          `code the grader accepts (run #7: 38 of 77 revealed hints failed ` +
          `their own grader). Copy the decisive lines out of solutionCode.`,
      ).toEqual([]);
    },
  );
});

/* ------------------------------------------------------------------ *
 * Gate C - a module may only advertise topics it teaches
 * ------------------------------------------------------------------ */

/**
 * module.yaml is sales copy: the `description` and the per-lesson `summary`
 * blocks both promise topics to someone deciding whether to pay. The WHOLE
 * file is searched deliberately, not just `description` - two of the three
 * shipped phantoms (saliency maps, frequentist statistics) were hiding in
 * lesson summaries, while advanced-time-series promised "temporal
 * convolutional networks" in its description and no TCN, conv1d, or dilated
 * convolution existed anywhere in the world.
 *
 * The term list is deliberately curated rather than derived. A generic
 * noun-phrase extractor flags prose ("production system", "real signals");
 * these are the concrete ML topics a buyer would read as a promise.
 */
const PROMISED_TOPICS = [
  "temporal convolutional network",
  "convolution",
  "kalman filter",
  "attention",
  "ensemble",
  "autoencoder",
  "quantization",
  "pruning",
  "spectrogram",
  "fourier",
  "lstm",
  "gru",
  "dropout",
  "softmax",
  "embedding",
  "transformer",
  "regularization",
  "batch normalization",
  "gradient descent",
  "backpropagation",
  "mutual information",
  "saliency",
  "frequentist",
  "bayes",
  "decision tree",
  "random forest",
  "xgboost",
  "knn",
  "webgpu",
  "webgl",
  "wasm",
  "onnx",
];

describe("module.yaml only advertises topics the module teaches", () => {
  const modules: { id: string; description: string; corpus: string }[] = [];

  for (const world of LAUNCHED_WORLD_DIRS) {
    const worldDir = join(CONTENT_ROOT, world);
    for (const mod of readdirSync(worldDir)) {
      const modDir = join(worldDir, mod);
      const yaml = join(modDir, "module.yaml");
      if (!existsSync(yaml)) continue;

      // The module's own lessons and exercises - NOT the description itself,
      // which would trivially match its own promise.
      let corpus = "";
      for (const f of readdirSync(modDir)) {
        if (f.endsWith(".mdx")) corpus += readFileSync(join(modDir, f), "utf8");
      }
      const exDir = join(modDir, "exercises");
      if (existsSync(exDir)) {
        for (const f of readdirSync(exDir)) {
          corpus += readFileSync(join(exDir, f), "utf8");
        }
      }

      modules.push({
        id: `${world}/${mod}`,
        description: readFileSync(yaml, "utf8").toLowerCase(),
        corpus: corpus.toLowerCase(),
      });
    }
  }

  it.each(modules)(
    "$id",
    ({
      id,
      description,
      corpus,
    }: {
      id: string;
      description: string;
      corpus: string;
    }) => {
      const phantom = PROMISED_TOPICS.filter((topic) => {
        if (!description.includes(topic)) return false;
        const singular = topic.replace(/s$/, "");
        return !corpus.includes(topic) && !corpus.includes(singular);
      });

      expect(
        phantom,
        `${id}/module.yaml advertises ${phantom
          .map((p) => `"${p}"`)
          .join(", ")} but no lesson or exercise in the module mentions it. ` +
          `This copy renders on the world page before purchase.`,
      ).toEqual([]);
    },
  );
});
