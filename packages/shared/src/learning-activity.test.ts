import { expect, it } from "vitest";
import {
  activityEvidenceLabel,
  validActivitySnapshot,
  type ActivitySnapshot,
  type ActivitySummary,
} from "./learning-activity";
const record: ActivitySnapshot = {
  activityId: "deep-orbit-normalization",
  version: 1,
  phase: "changed_case",
  streamId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  count: 1,
  first: { correct: false, assisted: false },
  latest: { correct: false, assisted: false },
  assistance: false,
  completedAt: null,
};
it("validates bounded summaries and rejects contradictory first-attempt outcomes", () => {
  expect(validActivitySnapshot(record)).toBe(true);
  for (const change of [
    { count: 21 },
    { count: -1 },
    { count: 1.5 },
    { count: 0 },
    { version: 2 },
    { activityId: "__proto__" },
    { phase: "application" },
    { streamId: "other" },
    { completedAt: "yesterday" },
    { latest: { correct: true, assisted: false } },
    {
      first: { correct: false, assisted: true },
      latest: { correct: false, assisted: true },
    },
  ])
    expect(validActivitySnapshot({ ...record, ...change })).toBe(false);
  expect(
    validActivitySnapshot({
      ...record,
      count: 0,
      first: null,
      latest: null,
      assistance: true,
    }),
  ).toBe(true);
  expect(
    validActivitySnapshot({
      ...record,
      activityId: "room-project-run",
      phase: "application",
    }),
  ).toBe(true);
});
it("does not turn an unknown older attempt into a completion or a report into a verified pass", () => {
  const row: ActivitySummary = {
    activity_id: record.activityId,
    content_version: 1,
    phase: record.phase,
    first_correct: false,
    first_assisted: null,
    latest_correct: false,
    latest_assisted: null,
    attempt_count: 1,
    assistance_observed: false,
    completed_at: null,
    source: "browser_check",
    updated_at: "2026-09-19T00:00:00Z",
  };
  expect(activityEvidenceLabel(row)).toBe(
    "Earlier attempt; assistance not recorded",
  );
  expect(activityEvidenceLabel({ ...row, latest_correct: true })).toBe(
    "Earlier completion; assistance not recorded",
  );
  expect(
    activityEvidenceLabel({
      ...row,
      first_assisted: false,
      latest_correct: true,
      source: "learner_report",
    }),
  ).toBe("External run reported");
});
