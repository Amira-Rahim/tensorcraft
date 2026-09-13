import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { BUILT_WORLD_DIRS } from "../src/built-worlds";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import {
  COVERAGE_LIMIT,
  collectGuidanceCases,
  scoreHint,
} from "../../../scripts/lib/hint-dictation.mjs";

/**
 * GATE: a guidance hint may not dictate the answer (audit round 5, 2026-09-08).
 *
 * THE FINDING. A submission built from nothing but each lesson's
 * guidance-level hint passed every shipped test in 55 of 65 exercises. The
 * middle rung of the ladder was not a hint, it was the answer, one click
 * cheaper than the solution rung it is supposed to protect.
 *
 * THE STRUCTURAL CAUSE, which is the part worth reading twice. This repo
 * already gates the SOLUTION rung (metadata-consistency.test.ts Gate B: a
 * solution hint must be a verbatim whitespace-normalized excerpt of
 * solutionCode) and had NO test anywhere touching the nudge or guidance
 * rungs. A repo-wide grep for one returned nothing. What is not gated here
 * drifts, and the ungated rung drifted all the way into dictation.
 *
 * WHAT IS MEASURED, and why these two rules and not others, lives in
 * scripts/lib/hint-dictation.mjs. In one sentence each:
 *
 *   1. A guidance hint may name at most 40% of the answer vocabulary, the
 *      identifiers and numbers that solutionCode uses and starterCode does
 *      not. The limit is the midpoint of a measured empty band: the hints
 *      that pass top out at 0.333 coverage, the ones that fail start at
 *      0.467, and every threshold in between returns the same verdict on all
 *      65 exercises.
 *   2. A guidance hint may not contain, verbatim, an answer call site out of
 *      solutionCode with its argument list filled in.
 *
 * THE UNIT IS THE PAIR, not the lesson. Eight launched lessons carry two or
 * three exercises, and a ladder written for the first legitimately says
 * nothing about the incident-* drill beside it. Scoring per pair reports
 * WHICH exercise a hint hands over and lets the drill pass on its own merits.
 * That is also why 9 of the 10 hints that survived the 2026-09-08
 * verification are incident drills: their lesson's ladder was aimed
 * elsewhere.
 *
 * EXPECT THIS SUITE RED UNTIL THE DE-DICTATION PASS LANDS. Measured at the
 * moment the gate shipped: 52 of the 65 pairs dictate. The list is not pinned
 * or allowlisted here on purpose. An allowlist of 52 is a muted gate, and a
 * muted gate is the exact failure this file exists to prevent. Run
 * `node scripts/report-hint-dictation.mjs` for the current scoreboard.
 */

const CONTENT_ROOT = join(__dirname, "..", "content");

type Case = {
  id: string;
  lessonId: string;
  slug: string;
  hint: string | null;
  exercise: { starterCode: string; solutionCode: string };
};

const cases: Case[] = collectGuidanceCases(CONTENT_ROOT, [...BUILT_WORLD_DIRS]);

/**
 * Count pin. 65 = every exercise in every launched lesson, since all 56
 * lessons ship a 3-rung ladder. A malformed hint scalar, a renamed exercise
 * or an <Exercise> tag that stops matching silently DROPS a pair out of
 * discovery, and a dropped pair is a hint nobody is checking, which is how
 * the guidance rung got here in the first place. Move this only when an
 * exercise is legitimately added or removed (the counts themselves are pinned
 * in packages/shared EXERCISE_CONTENT and exercise-counts.test.ts).
 */
const EXPECTED_CASES = 65;

/**
 * The hints that HELD under the 2026-09-08 verification: a submission built
 * from the guidance rung alone did NOT pass these exercises. They are the
 * gate's known-good calibration set, and the gate must keep passing them, or
 * the rules have started punishing hints that teach.
 *
 * batch-data is deliberately NOT in this list even though it held. Measured:
 * its guidance hint quotes three answer call sites verbatim
 * (`tf.data.generator(sensorGen)`, `.shuffle(10)`, `.batch(4)`) and names
 * 73% of the answer vocabulary. It held for one
 * reason: it says to build the ys tensor "with tf.tensor" without saying to
 * wrap the label in an array, so a hint-only submission yields scalar ys and
 * fails the [4, 1] shape assertion. A hint that hands over four of five
 * decisions and survives on the fifth is a dictation with a typo, not a hint.
 */
const VERIFIED_NON_DICTATIONS = [
  "incident-tensor-leak",
  "incident-baseline-drift",
  "incident-false-alarm-storm",
  "incident-missed-anomaly",
  "incident-stale-verdict",
  // incident-checker-down was on this list and is not any more. It was
  // RETIRED on 2026-09-11 under the owner-approved coverage plan: it handed
  // over a numbered recipe whose decision rule appeared in no lesson, and its
  // slot now carries `retrieve-signals`, the RAG retrieve half. This list is a
  // historical calibration set (the hints that HELD under the 2026-09-08
  // verification), so a slug that did not exist then does not belong in it.
  // retrieve-signals is covered by the per-pair suite below like every other
  // exercise; it is simply not a verified-held datapoint.
  "ci-cd-gate",
  "verify-deployment",
  "launch-rehearsal",
];

describe("guidance hints do not dictate the answer", () => {
  it(`discovers exactly ${EXPECTED_CASES} (guidance hint, exercise) pairs (count pin)`, () => {
    expect(cases.length).toBe(EXPECTED_CASES);
  });

  it("every launched lesson ships a guidance rung", () => {
    const missing = cases.filter((c) => !c.hint).map((c) => c.id);
    expect(
      missing,
      `these lessons have no guidance-level hint, so nothing above ` +
        `checks them: ${missing.join(", ")}. Either author the rung or ` +
        `drop the ladder to nudge + solution, which the schema allows.`,
    ).toEqual([]);
  });

  it("the hints that held under verification still pass the gate (precision pin)", () => {
    // If this test goes red, the rules have drifted into punishing hints that
    // only teach, and the threshold is wrong. Fix the gate, not the hints.
    const regressions = VERIFIED_NON_DICTATIONS.map((slug) => {
      const found = cases.find((c) => c.slug === slug);
      if (!found) return `${slug}: pair not discovered`;
      const score = scoreHint(found.hint ?? "", found.exercise);
      return score.dictates
        ? `${slug}: coverage ${score.coverage.toFixed(3)}, ` +
            `${score.quotedCallSites.length} quoted call site(s)`
        : null;
    }).filter(Boolean);
    expect(regressions).toEqual([]);
  });

  it.each(cases)("$id", ({ id, hint, exercise }: Case) => {
    const score = scoreHint(hint ?? "", exercise);
    const percent = (score.coverage * 100).toFixed(0);
    const limit = (COVERAGE_LIMIT * 100).toFixed(0);
    expect(
      score.dictates,
      `${id}: this guidance hint hands over the answer instead of ` +
        `pointing at it.\n` +
        `  It names ${score.namedAnswers.length} of the ${score.answerCount} ` +
        `identifiers and numbers the solution adds to the starter ` +
        `(${percent}%, limit ${limit}%): ` +
        `${score.namedAnswers.join(", ")}\n` +
        (score.quotedCallSites.length
          ? `  It quotes these answer call sites verbatim, arguments and ` +
            `all: ${score.quotedCallSites.join(" | ")}\n`
          : "") +
        `  The guidance rung names the DECISION the learner has to make and ` +
        `the property that settles it. Naming the API is teaching; handing ` +
        `over the call with its arguments is transcription, and it makes the ` +
        `solution rung below it pointless. Move the code down to the ` +
        `solution rung, which is gated to be a verbatim excerpt anyway.`,
    ).toBe(false);
  });
});
