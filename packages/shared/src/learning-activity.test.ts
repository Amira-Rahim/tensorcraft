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
it("keeps the rebuilt channel activity separate from its earlier content version", () => {
  expect(
    validActivitySnapshot({
      ...record,
      activityId: "deep-orbit-channel-layout",
      version: 2,
    }),
  ).toBe(true);
  expect(
    validActivitySnapshot({
      ...record,
      activityId: "deep-orbit-channel-layout",
      version: 1,
    }),
  ).toBe(false);
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
it("labels historical activity outcomes without erasing recorded assistance", () => {
  const row: ActivitySummary = {
    activity_id: "deep-orbit-channel-layout",
    content_version: 2,
    phase: "changed_case",
    first_correct: false,
    first_assisted: false,
    latest_correct: true,
    latest_assisted: true,
    attempt_count: 2,
    assistance_observed: true,
    completed_at: null,
    source: "browser_check",
    updated_at: "2026-10-16T00:00:00Z",
  };
  expect(activityEvidenceLabel(row)).toBe("Changed case passed with help");
  expect(activityEvidenceLabel({ ...row, content_version: 1 })).toBe(
    "Earlier activity version: Changed case passed with help",
  );
  expect(
    activityEvidenceLabel({
      ...row,
      content_version: 1,
      latest_correct: false,
    }),
  ).toBe("Earlier activity version: Needs another look");
  expect(
    activityEvidenceLabel({ ...row, content_version: 1, first_assisted: null }),
  ).toBe("Earlier completion; assistance not recorded");
});
