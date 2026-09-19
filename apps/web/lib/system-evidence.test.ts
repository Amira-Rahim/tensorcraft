import { expect, it } from "vitest";
import { buildSystemEvidence } from "./system-evidence";
import {
  activityEvidenceLabel,
  type ActivitySummary,
} from "@tensorcraft/shared";
const lessons = [
  { slug: "normalization", moduleId: "foundations", title: "Normalization" },
  {
    slug: "threshold-tuning",
    moduleId: "anomaly-detection",
    title: "Threshold",
  },
  { slug: "launch", moduleId: "capstone", title: "Launch" },
];
const summary: ActivitySummary = {
  activity_id: "deep-orbit-normalization",
  content_version: 1,
  phase: "changed_case",
  first_correct: false,
  first_assisted: false,
  latest_correct: true,
  latest_assisted: true,
  attempt_count: 3,
  assistance_observed: true,
  completed_at: null,
  source: "browser_check",
  updated_at: "2026-09-19T10:00:00Z",
};
it("keeps browser practice, exercise pass, lesson completion and due review distinct", () => {
  const stages = buildSystemEvidence({
    lessons,
    progress: [
      {
        lesson_id: "normalization",
        world_id: "deep-orbit",
        status: "completed",
      },
    ],
    activities: [summary],
    reviews: [{ lesson_id: "threshold-tuning", next_review_at: "2026-09-18" }],
    attempts: [
      {
        lesson_id: "normalization",
        world_id: "deep-orbit",
        score: 100,
        hints_used: 0,
        attempted_at: "2026-09-19",
      },
    ],
    now: new Date("2026-09-19"),
  });
  expect(stages).toHaveLength(5);
  expect(stages[0].completedLessons).toBe(1);
  expect(stages[0].work[0].label).toContain("Changed case passed with help");
  expect(stages[0].work[0].detail).toContain("First did not match");
  expect(stages[0].work[1].label).toContain("Recorded exercise pass");
  expect(stages[2].due).toHaveLength(1);
  expect(stages[2].next.href).toContain("#step-1");
});
it("does not call unknown assistance independent or an older failed attempt a completion", () => {
  expect(activityEvidenceLabel({ ...summary, content_version: 9 })).toBe(
    "Earlier completion; assistance not recorded",
  );
  const stages = buildSystemEvidence({
    lessons,
    progress: [],
    activities: [],
    reviews: [],
    attempts: [
      {
        lesson_id: "normalization",
        world_id: "deep-orbit",
        score: 50,
        hints_used: null,
        attempted_at: "2026-09-19",
      },
    ],
    now: new Date(),
  });
  expect(stages[0].work[0].label).toBe(
    "Normalization: Earlier attempt; assistance not recorded",
  );
  expect(stages[0].completedLessons).toBe(0);
});
it("labels an external report by provenance and ignores unrelated or invented activity IDs", () => {
  const rows = [
    {
      ...summary,
      activity_id: "room-project-run",
      phase: "application",
      source: "learner_report",
    },
    { ...summary, activity_id: "forged" },
  ];
  const stages = buildSystemEvidence({
    lessons,
    progress: [],
    activities: rows,
    reviews: [],
    attempts: [],
    now: new Date(),
  });
  expect(stages.flatMap((s) => s.work)).toHaveLength(1);
  expect(stages[4].work[0].label).toContain("External run reported");
  expect(stages[4].work[0].detail).toContain("has not verified");
  expect(stages[4].completedLessons).toBe(0);
});
