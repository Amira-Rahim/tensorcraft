import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { BUILT_WORLD_DIRS } from "../src/built-worlds";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import {
  COVERAGE_LIMIT,
  collectStarterCases,
  scoreStarter,
} from "../../../scripts/lib/starter-dictation.mjs";

/**
 * GATE: a starter may not dictate the answer (audit round 6, 2026-09-12).
 *
 * THE FINDING. The exercise lens reads a grade below every other lens, and
 * the largest unactioned reason is the starters. The difficulty auditor
 * counted 42 of 65 starters handing the learner a numbered algorithm to
 * transcribe. Measured with the metric below: 32 of 65 starters carry three
 * or more numbered comment steps, and 28 of 65 have starter COMMENTS naming
 * 40% or more of the vocabulary the solution adds. A starter like that turns
 * the exercise into typing, and the grader then certifies the typing.
 *
 * THE STRUCTURAL CAUSE, which is the part worth reading twice. The hint
 * ladder got its dictation gate on 2026-09-08
 * (guidance-hint-dictation.test.ts, after a submission built from the
 * guidance rung alone passed 55 of 65 exercises). Starters got nothing: no
 * test in this repo read starterCode for dictation. The drift is measurable.
 * Four starters rewritten on 2026-09-12 sit at the top of the table again
 * (kalman-filter 1.000, classify-anomaly 0.732, launch-rehearsal 0.731,
 * build-lstm 0.600). What is not gated here drifts back.
 *
 * WHAT IS MEASURED, and why these rules and not others, lives in
 * scripts/lib/starter-dictation.mjs. In one sentence each:
 *
 *   1. A starter's comments may name at most 32% of the answer vocabulary,
 *      the identifiers and numbers that solutionCode uses and starterCode's
 *      code does not. The limit sits in a measured empty band: the pinned
 *      known-good set tops out at 0.300, the pinned known-bad set starts at
 *      0.333, and every limit in between returns the same verdict on all 65.
 *   2. A starter comment may not contain, verbatim, an answer call site out
 *      of solutionCode with its argument list filled in.
 *   3. A starter comment may not contain, verbatim, a run of solution code
 *      carrying an operator and two or more identifiers. This is the case
 *      rule 1 cannot see: a starter that declares rich types has almost no
 *      answer vocabulary left, so restating its arithmetic scores nothing.
 *   4. A starter comment may not say the word recipe.
 *
 * NUMBERED STEPS ARE EVIDENCE, NOT A TRIGGER. An outline that names nothing
 * is allowed (add-tensors and backprop-chain each carry two numbered steps at
 * 0.000 coverage; the original example, three signal-processing outlines
 * with three steps at 0.000, was de-recipeed on 2026-09-12 and is now
 * zero steps, which is why the fixture, not the corpus, pins this rule.
 * the pinned sets anyway: build-autoencoder, pinned as scaffolding, and
 * load-pretrained-pipeline both carry 4 steps at 0.300 coverage. The count is
 * printed as evidence and decides nothing.
 *
 * WHAT A STARTER MAY CONTAIN, which is what a red case should be rewritten
 * to: the signature with its parameter names and types, the data and fixtures
 * the learner is given, a one- or two-line pointer at nudge level naming the
 * decision to make or the property that settles it, and
 * `return null; // your code here`. The CONTRACT the grader checks belongs in
 * the instructions, stated plainly. Moving a recipe out of a starter must not
 * leave a graded requirement unstated anywhere: the round-6 audit found nine
 * instruction texts already disagreeing with their grader, and this gate does
 * not check that half, so the author does.
 *
 * HOW THE SUITE IS BUILT. One case per starter, plus four pins that hold the
 * rule itself still: the count of starters discovered, the non-emptiness of
 * what the reader returned, the 12 no-recipe starters that must keep passing,
 * and the coverage limit's measured band. Recall also has six fixtures that
 * own their own code, one per rule, so the rules stay checkable on the day
 * every real starter is clean.
 *
 * EXPECT THIS SUITE RED UNTIL THE DE-RECIPE PASS LANDS. Measured at the
 * moment the gate shipped: 31 of the 65 starters dictate. The list is not
 * pinned or allowlisted here on purpose. An allowlist of 31 is a muted gate,
 * and a muted gate is the exact failure this file exists to prevent. Run
 * `node scripts/report-starter-dictation.mjs` for the current scoreboard and
 * `--band` for the threshold evidence.
 */

const CONTENT_ROOT = join(__dirname, "..", "content");

type Case = {
  id: string;
  slug: string;
  module: string;
  file: string;
  starterCode: string;
  solutionCode: string;
};

const cases: Case[] = collectStarterCases(CONTENT_ROOT, [...BUILT_WORLD_DIRS]);

/**
 * Count pin. 65 = every exercise in the launched world. A renamed directory,
 * a dropped YAML or a field reader that stops matching silently DROPS a
 * starter out of discovery, and a dropped starter is one nobody is checking,
 * which is how the starters got here in the first place. Move this only when
 * an exercise is legitimately added or removed (the counts themselves are
 * pinned in packages/shared EXERCISE_CONTENT and exercise-counts.test.ts).
 */
const EXPECTED_STARTERS = 65;

/**
 * The starters written deliberately without a recipe: a signature, the
 * fixtures, a pointer, and the work left to the learner. They are the gate's
 * known-good calibration set and it must keep passing them.
 *
 * IF THIS GOES RED, THE RULE HAS DRIFTED INTO PUNISHING SCAFFOLDING. Fix the
 * gate, not these starters. build-autoencoder is the tightest of them at
 * 0.300 coverage, because its four numbered steps do name the layer sizes
 * (8, 4, 2) and relu; it is the reason the coverage band is only 0.300 to
 * 0.333 wide, and it is the first row a threshold move would break.
 */
const NO_RECIPE_STARTERS = [
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
];

/**
 * The empty band the coverage limit has to sit in, measured 2026-09-12 with
 * `node scripts/report-starter-dictation.mjs --band`: the no-recipe set above
 * tops out at 0.300 and the 11 starters the round-6 audit named as dictation
 * start at 0.333, with nothing in between. The floor keeps a threshold move
 * from punishing scaffolding and the ceiling keeps one from muting the gate.
 *
 * RECALL IS PINNED HERE AND IN THE FIXTURES BELOW, NOT AS A LIST OF SLUGS.
 * A list asserting "these 11 must stay flagged" goes red the moment a module
 * owner rewrites one, in a file the owner does not own, and the cheapest way
 * out of a red like that is to delete the list. A band pin plus fixtures
 * cannot be satisfied by editing content, so they keep working through the
 * de-recipe pass. For the record, all 11 were flagged when the gate shipped:
 * kalman-filter 1.000, incident-missed-anomaly 0.909, pipeline-architecture
 * 0.800, normalize-data 0.789, deep-scan-eval 0.769, classify-anomaly 0.732,
 * launch-rehearsal 0.731, export-model-artifact 0.684, tfjs-setup 0.500,
 * write-model-card 0.435, ci-cd-gate 0.333.
 */
const BAND = { floor: 0.3, ceiling: 0.3333 };

/**
 * Rule-by-rule fixtures, each written to trip exactly one rule, so recall
 * survives the day every real starter is clean. The numbers in the comments
 * are measured, not asserted by hand.
 */
const FIXTURES = {
  summarizeSolution: `
function summarize(readings) {
  const mean = readings.reduce((a, b) => a + b, 0) / readings.length;
  const variance =
    readings.reduce((a, b) => a + (b - mean) ** 2, 0) / readings.length;
  const spread = Math.sqrt(variance);
  return { mean, spread };
}
`,
  namesTheVocabulary: `
function summarize(readings) {
  // Reduce the readings to a mean, then take the spread from the variance,
  // then hand both back under the keys mean and spread.
  return null; // your code here
}
`,
  pointsAtTheDecision: `
function summarize(readings) {
  // Two numbers come back, and the second has to describe scatter rather
  // than level. Decide what to divide by before you write it.
  return null; // your code here
}
`,
  outlineNamingNothing: `
function summarize(readings) {
  // 1. Centre the series.
  // 2. Measure how far it scatters.
  // 3. Report both.
  return null; // your code here
}
`,
  quotesACallSite: {
    starterCode: `
const LABELS = ['quiet', 'anomalous'];

function classify(signal, model) {
  // Hand the reading to model.predict(signal) and read the label off it.
  return null; // your code here
}
`,
    solutionCode: `
const LABELS = ['quiet', 'anomalous'];

function classify(signal, model) {
  const scores = model.predict(signal);
  const best = scores.indexOf(Math.max(...scores));
  return { label: LABELS[best], confidence: scores[best] };
}
`,
  },
  quotesAnExpression: {
    starterCode: `
function decide({ accuracy, minAccuracy }) {
  // An empty batch fails, and the threshold comparison is
  // accuracy >= minAccuracy.
  return null; // your code here
}
`,
    solutionCode: `
function decide({ accuracy, minAccuracy }) {
  const passed = accuracy >= minAccuracy;
  return { accuracy, minAccuracy, passed };
}
`,
  },
  saysRecipe: {
    starterCode: `
function median(readings) {
  // Recipe: the middle value of the ordered series.
  return null; // your code here
}
`,
    solutionCode: `
function median(readings) {
  const ordered = [...readings].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)];
}
`,
  },
};

describe("starters do not dictate the answer", () => {
  it(`discovers exactly ${EXPECTED_STARTERS} starters (count pin)`, () => {
    expect(cases.length).toBe(EXPECTED_STARTERS);
  });

  it("every discovered starter and solution actually read", () => {
    // A field reader that silently returns "" scores 0 and passes, which
    // would mute the gate one slug at a time.
    const empty = cases
      .filter((c) => !c.starterCode.trim() || !c.solutionCode.trim())
      .map((c) => c.id);
    expect(
      empty,
      `starterCode or solutionCode came back empty for: ${empty.join(", ")}. ` +
        `The YAML shape changed and the reader in ` +
        `scripts/lib/starter-dictation.mjs no longer matches it, so these ` +
        `starters are scoring 0 for free.`,
    ).toEqual([]);
  });

  it("the starters written without a recipe still pass (precision pin)", () => {
    const regressions = NO_RECIPE_STARTERS.map((slug) => {
      const found = cases.find((c) => c.slug === slug);
      if (!found) return `${slug}: starter not discovered`;
      const score = scoreStarter(found);
      return score.dictates
        ? `${slug}: coverage ${score.coverage.toFixed(3)}, ` +
            `${score.quotedCallSites.length} quoted call site(s), ` +
            `quoted expression ${score.quotedExpression || "(none)"}, ` +
            `recipe ${score.namesRecipe}`
        : null;
    }).filter(Boolean);
    expect(
      regressions,
      `these starters are scaffolding, not dictation, and the rule just ` +
        `flagged them: ${regressions.join(" | ")}. Fix the gate, not the ` +
        `starters: re-measure the band with ` +
        `\`node scripts/report-starter-dictation.mjs --band\` before ` +
        `touching any content.`,
    ).toEqual([]);
  });

  it("the coverage limit stays inside the measured band (recall pin)", () => {
    expect(
      COVERAGE_LIMIT,
      `the coverage limit is ${COVERAGE_LIMIT}, outside the band measured on ` +
        `2026-09-12 (${BAND.floor} to ${BAND.ceiling}). Below the floor it ` +
        `flags build-autoencoder, which is scaffolding. Above the ceiling it ` +
        `stops flagging ci-cd-gate and incident-tensor-leak, both at 0.333, ` +
        `and the gate starts certifying dictation. Re-measure with ` +
        `\`node scripts/report-starter-dictation.mjs --band\` and move the ` +
        `band and this pin together, or not at all.`,
    ).toBeGreaterThanOrEqual(BAND.floor);
    expect(COVERAGE_LIMIT).toBeLessThanOrEqual(BAND.ceiling);
  });

  describe("the rules still catch dictation (fixtures, content-independent)", () => {
    it("flags a starter whose comments name the answer vocabulary", () => {
      const score = scoreStarter({
        starterCode: FIXTURES.namesTheVocabulary,
        solutionCode: FIXTURES.summarizeSolution,
      });
      // Measured: 4 of 9 answer tokens named (mean, reduce, spread, variance).
      expect(score.coverage).toBeGreaterThan(COVERAGE_LIMIT);
      expect(score.dictates).toBe(true);
    });

    it("flags a quoted call site even when coverage is under the limit", () => {
      const score = scoreStarter(FIXTURES.quotesACallSite);
      // Measured: coverage 0.250, one quoted call site, model.predict(signal).
      expect(score.coverage).toBeLessThan(COVERAGE_LIMIT);
      expect(score.quotedCallSites).toHaveLength(1);
      expect(score.dictates).toBe(true);
    });

    it("flags a quoted expression at zero coverage (the ci-cd-gate case)", () => {
      const score = scoreStarter(FIXTURES.quotesAnExpression);
      // Measured: coverage 0.000 because the signature declares every name,
      // and the comment still restates `accuracy >= minAccuracy`.
      expect(score.coverage).toBe(0);
      expect(score.quotedExpression).toContain("accuracy >= minAccuracy");
      expect(score.dictates).toBe(true);
    });

    it("flags the word recipe on its own", () => {
      const score = scoreStarter(FIXTURES.saysRecipe);
      // Measured: coverage 0.167, no quoted call site, no quoted expression.
      expect(score.coverage).toBeLessThan(COVERAGE_LIMIT);
      expect(score.namesRecipe).toBe(true);
      expect(score.dictates).toBe(true);
    });

    it("passes a pointer at the decision", () => {
      const score = scoreStarter({
        starterCode: FIXTURES.pointsAtTheDecision,
        solutionCode: FIXTURES.summarizeSolution,
      });
      expect(score.coverage).toBe(0);
      expect(score.dictates).toBe(false);
    });

    it("passes a numbered outline that names nothing (steps are not a trigger)", () => {
      const score = scoreStarter({
        starterCode: FIXTURES.outlineNamingNothing,
        solutionCode: FIXTURES.summarizeSolution,
      });
      expect(score.numberedSteps).toBe(3);
      expect(score.dictates).toBe(false);
    });
  });

  it("no starter says recipe out loud", () => {
    const named = cases
      .filter((c) => scoreStarter(c).namesRecipe)
      .map((c) => c.id);
    expect(
      named,
      `these starters announce a recipe in a comment: ${named.join(", ")}. ` +
        `The word is the tell, and the list under it is the thing to remove. ` +
        `A starter states the signature and the decision; the steps the ` +
        `grader checks belong in the instructions.`,
    ).toEqual([]);
  });

  it.each(cases)("$id", (c: Case) => {
    const score = scoreStarter(c);
    const percent = (score.coverage * 100).toFixed(0);
    const limit = (COVERAGE_LIMIT * 100).toFixed(0);
    expect(
      score.dictates,
      `${c.id}: this starter hands over the answer in its comments instead ` +
        `of pointing at it.\n` +
        (score.namesRecipe
          ? `  It says the word recipe, which is the tell before any score.\n`
          : "") +
        `  Its comments name ${score.namedAnswers.length} of the ` +
        `${score.answerCount} identifiers and numbers the solution adds to ` +
        `the starter (${percent}%, limit ${limit}%): ` +
        `${score.namedAnswers.join(", ") || "(none)"}\n` +
        (score.quotedCallSites.length
          ? `  It quotes these answer call sites verbatim, arguments and ` +
            `all: ${score.quotedCallSites.join(" | ")}\n`
          : "") +
        (score.quotedExpression
          ? `  It quotes this run of the solution verbatim: ` +
            `${score.quotedExpression}\n`
          : "") +
        (score.numberedSteps
          ? `  It also runs ${score.numberedSteps} numbered steps. Numbering ` +
            `alone is fine, an outline is allowed; numbering the solution's ` +
            `own vocabulary is what this flags.\n`
          : "") +
        `  Keep the signature, the fixtures the learner is given, and a one- ` +
        `or two-line pointer at the decision to make. Move the contract the ` +
        `grader checks into the instructions, where it has to be stated ` +
        `anyway, and leave the code to the learner.`,
    ).toBe(false);
  });
});
