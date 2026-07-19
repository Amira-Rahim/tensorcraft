import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { describe, it, expect } from "vitest";
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
 * Velite ships `{deep-orbit,extras}` (velite.config.ts LAUNCHED_THEME_DIRS).
 * Anything a customer can load, these gates check.
 */
const CONTENT_ROOT = dirname(CONTENT_DIR);
const LAUNCHED_THEME_DIRS = ["deep-orbit", "extras"];

function launchedLessonFiles(): string[] {
  return LAUNCHED_THEME_DIRS.flatMap((theme) =>
    lessonFiles(join(CONTENT_ROOT, theme)),
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
 */

/** Collapse whitespace so YAML block-scalar vs single-line quoting differences never matter. */
function normalizeCode(code: string): string {
  return code.replace(/\s+/g, " ").trim();
}

/** Undo YAML double-quote escaping in frontmatter hint strings. */
function unescapeHint(hint: string): string {
  return hint.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

describe("solution hints are verbatim excerpts of their exercise's solutionCode", () => {
  const cases: {
    id: string;
    hint: string;
    solutions: string[];
  }[] = [];

  for (const file of launchedLessonFiles()) {
    const source = readFileSync(file, "utf8");
    const hint = frontmatter(source).match(
      /^ {2}- level: solution\n {4}content:\s*"([\s\S]*?)"\n(?= {2}[-\w]|\w)/m,
    )?.[1];
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
      const solution =
        readFileSync(path, "utf8").match(
          /^solutionCode:[\s\S]*?(?=^testCode:)/m,
        )?.[0] ?? "";
      return solution.trim() ? [solution] : [];
    });
    if (solutions.length === 0) continue;
    cases.push({
      id: `${lessonId(file)}::${slugs.join("+")}`,
      hint,
      solutions,
    });
  }

  it("found a solution hint for most lessons (sanity)", () => {
    expect(cases.length).toBeGreaterThan(60);
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
      const fragments = unescapeHint(hint)
        .split(";")
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
 * convolution existed anywhere in the theme.
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

  for (const theme of LAUNCHED_THEME_DIRS) {
    const themeDir = join(CONTENT_ROOT, theme);
    for (const mod of readdirSync(themeDir)) {
      const modDir = join(themeDir, mod);
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
        id: `${theme}/${mod}`,
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
          `This copy renders on the theme page before purchase.`,
      ).toEqual([]);
    },
  );
});
