// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import {
  prepareStudy,
  summarizePilot,
  summarizeReview,
} from "./learning-study.mjs";

let scratch: string, pilot: any, review: any;
const reviewer = {
  id: "R1",
  wroteReviewedMaterial: false,
  expertise: "ML evaluation",
  relationships: "Paid fixed fee; no author relationship",
};
const observation = (date = "2026-10-10T12:00:00Z") => ({
  observedAt: date,
  assistance: [],
  activeMinutes: 15,
  evidence: ["private/session-note-1"],
});
const project = () => ({
  ...observation(),
  scores: [2, 2, 2, 2, 1],
  blockers: [],
  reviewerId: "R1",
  runnable: true,
  failureExplained: true,
  freshChangeCompleted: true,
  solutionRevealed: false,
});
const participant = (i = 1) => ({
  id: `P${String(i).padStart(3, "0")}`,
  consented: true,
  newToMl: true,
  jsBackground: i % 2 ? "browser" : "node",
  outsideOwnerNetwork: true,
  enrolledAt: "2026-10-01T12:00:00Z",
  courseCompletedAt: "2026-10-10T12:00:00Z",
  firstModule: {
    ...observation(),
    started: true,
    completed: true,
    authorIntervention: false,
  },
  early: project(),
  final: project(),
  pre: {
    ...observation("2026-10-01T12:00:00Z"),
    correct: [true, false, false, false, false],
  },
  post: { ...observation(), correct: [true, true, true, true, true] },
  delayed: {
    ...observation("2026-10-17T12:00:00Z"),
    correct: [true, true, true, true, false],
  },
  reading: { ...observation(), passageExplained: true, storyConsequence: true },
  followup: {
    observedAt: "2026-11-09T12:00:00Z",
    usedProject: true,
    artifactObserved: false,
    evidence: ["private/followup-note"],
  },
});
beforeEach(() => {
  scratch = mkdtempSync(join(tmpdir(), "tensorcraft-study-test-"));
  prepareStudy(join(scratch, "study"));
  pilot = JSON.parse(readFileSync(join(scratch, "study/pilot.json"), "utf8"));
  review = JSON.parse(readFileSync(join(scratch, "study/review.json"), "utf8"));
});
afterEach(() => rmSync(scratch, { recursive: true, force: true }));
const collect = () =>
  Object.assign(pilot, {
    state: "closed",
    startsAt: "2026-10-01T00:00:00Z",
    endsAt: "2026-10-20T00:00:00Z",
    asOf: "2026-12-01T00:00:00Z",
    ownerContact: "Study owner, private contact record",
    consentRetention: "Delete identifiable records by 2027-01-01",
    compensation: "Fixed agreed amount",
    reviewers: [reviewer],
  });

it("creates drafts without synthetic results, leaves zero denominators unknown and preserves existing records", () => {
  const summary = summarizePilot(pilot);
  expect(summary.enrolled).toBe(0);
  expect(summary.acceptance).toBe("not_accepted");
  expect(summary.gates.finalProject).toMatchObject({
    denominator: 0,
    percent: null,
    status: "no_evidence",
  });
  expect(summarizeReview(review)).toMatchObject({
    subjectComplete: 0,
    editorialComplete: 0,
    acceptance: "not_accepted",
  });
  expect(() => prepareStudy(join(scratch, "study"))).toThrow("already exists");
});
it("uses all enrolled learners for final completion and separates early submitter and enrollment rates", () => {
  collect();
  pilot.participants = Array.from({ length: 12 }, (_, i) => participant(i + 1));
  for (const learner of pilot.participants.slice(8))
    Object.assign(learner, {
      early: null,
      final: null,
      delayed: null,
      followup: null,
      courseCompletedAt: null,
    });
  const summary = summarizePilot(pilot);
  expect(summary.gates.earlyTransfer).toMatchObject({
    numerator: 8,
    denominator: 8,
    percent: 100,
  });
  expect(summary.earlyPassAmongEnrolled).toMatchObject({
    numerator: 8,
    denominator: 12,
  });
  expect(summary.gates.finalProject).toMatchObject({
    numerator: 8,
    denominator: 12,
    status: "not_met",
  });
  expect(summary.missing.final).toBe(4);
  expect(summary.acceptance).toBe("not_accepted");
});
it("does not turn a high score into a pass with leakage, reveal or missing explanation", () => {
  collect();
  const learner = participant();
  learner.early.solutionRevealed = true;
  learner.final.blockers = ["held-out scaler fitted"] as never[];
  pilot.participants = [learner];
  expect(summarizePilot(pilot).gates.earlyTransfer.numerator).toBe(0);
  expect(summarizePilot(pilot).gates.finalProject.numerator).toBe(0);
  learner.final.blockers = [];
  learner.final.failureExplained = false;
  expect(summarizePilot(pilot).gates.finalProject.numerator).toBe(0);
});
it("retains late/missing delayed responses and distinguishes reported use from observed artifacts", () => {
  collect();
  pilot.participants = [participant(1), participant(2), participant(3)];
  pilot.participants[1].delayed.observedAt = "2026-10-25T12:00:00Z";
  pilot.participants[2].delayed = null;
  pilot.participants[2].followup = null;
  const summary = summarizePilot(pilot);
  expect(summary.gates.delayedReturn).toMatchObject({
    numerator: 1,
    denominator: 3,
  });
  expect(summary.delayedOutsideWindow).toBe(1);
  expect(summary.missing.delayed).toBe(2);
  expect(summary.followup).toMatchObject({
    reportedUse: 2,
    artifactObserved: 0,
  });
  expect(summary.pairedConceptChecks).toEqual({
    count: 3,
    preCorrect: 3,
    postCorrect: 15,
    possibleEach: 15,
  });
});
it("does not accept an undersized cohort or an open observation window", () => {
  collect();
  pilot.participants = [participant()];
  expect(summarizePilot(pilot).acceptance).toBe("not_accepted");
  pilot.state = "collecting";
  expect(summarizePilot(pilot).gates.firstModule.status).toBe("collecting");
  pilot.state = "closed";
  pilot.asOf = "2026-10-22T00:00:00Z";
  expect(() => summarizePilot(pilot)).toThrow("windows are still open");
});
it("requires explicit evidence and independence, rejects duplicate IDs and detects source drift", () => {
  collect();
  pilot.participants = [participant(), participant()];
  expect(() => summarizePilot(pilot)).toThrow("unique");
  pilot.participants = [participant()];
  pilot.participants[0].final.assistance = null;
  expect(() => summarizePilot(pilot)).toThrow("help, time and evidence");
  pilot.participants = [participant()];
  pilot.reviewers[0] = { ...reviewer, wroteReviewedMaterial: true };
  expect(() => summarizePilot(pilot)).toThrow("independent reviewer");
  review.snapshot[0].sha256 = "0".repeat(64);
  expect(summarizeReview(review).sourceChanges).toHaveLength(1);
  review.artifacts[0].subject.status = "complete";
  expect(() => summarizeReview(review)).toThrow("independent reviewer");
});
it("reports only diagnostic threshold completion for a fully observed synthetic test fixture", () => {
  collect();
  pilot.participants = Array.from({ length: 12 }, (_, i) => participant(i + 1));
  expect(summarizePilot(pilot).acceptance).toBe("diagnostic_thresholds_met");
});
