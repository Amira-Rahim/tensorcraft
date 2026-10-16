/** These are browser-reported practice records, never authoritative scores. */
export const LEARNING_ACTIVITIES = {
  "deep-orbit-channel-layout": {
    version: 2,
    stage: "data",
    module: "foundations",
    lesson: "tensor-shapes",
    title: "Channel layout",
  },
  "deep-orbit-normalization": {
    version: 1,
    stage: "data",
    module: "foundations",
    lesson: "normalization",
    title: "Model and scaler",
  },
  "deep-orbit-learning-rate": {
    version: 1,
    stage: "model",
    module: "training-loop",
    lesson: "gradient-descent",
    title: "Learning-rate updates",
  },
  "deep-orbit-threshold": {
    version: 1,
    stage: "evaluation",
    module: "anomaly-detection",
    lesson: "threshold-tuning",
    title: "Threshold policy",
  },
  "deep-orbit-fft": {
    version: 1,
    stage: "model",
    module: "signal-processing",
    lesson: "fourier-transform",
    title: "FFT window",
  },
  "deep-orbit-attention": {
    version: 1,
    stage: "model",
    module: "advanced-time-series",
    lesson: "beyond-lstm",
    title: "Attention values",
  },
  "deep-orbit-cache": {
    version: 1,
    stage: "runtime",
    module: "optimization-edge",
    lesson: "caching-strategies",
    title: "Cache identity",
  },
  "room-project-run": {
    version: 1,
    stage: "operations",
    module: "capstone",
    lesson: "launch",
    title: "External room-project run",
  },
} as const;
export type LearningActivityId = keyof typeof LEARNING_ACTIVITIES;
export type SystemStage =
  "data" | "model" | "evaluation" | "runtime" | "operations";
export type ActivityPhase = "prediction" | "changed_case" | "application";
export interface ActivitySnapshot {
  activityId: LearningActivityId;
  version: number;
  phase: ActivityPhase;
  streamId: string;
  count: number;
  first: { correct: boolean; assisted: boolean } | null;
  latest: { correct: boolean; assisted: boolean } | null;
  assistance: boolean;
  completedAt: string | null;
}
export interface ActivitySummary {
  activity_id: string;
  content_version: number;
  phase: string;
  first_correct: boolean | null;
  first_assisted: boolean | null;
  latest_correct: boolean | null;
  latest_assisted: boolean | null;
  attempt_count: number;
  assistance_observed: boolean;
  completed_at: string | null;
  source: string;
  updated_at: string;
}
export function validActivitySnapshot(
  value: unknown,
): value is ActivitySnapshot {
  if (!value || typeof value !== "object") return false;
  const s = value as ActivitySnapshot;
  const spec = Object.prototype.hasOwnProperty.call(
    LEARNING_ACTIVITIES,
    s.activityId,
  )
    ? LEARNING_ACTIVITIES[s.activityId]
    : null;
  const outcome = (o: ActivitySnapshot["first"]) =>
    o === null ||
    (!!o && typeof o.correct === "boolean" && typeof o.assisted === "boolean");
  return (
    !!spec &&
    s.version === spec.version &&
    (s.activityId === "room-project-run"
      ? s.phase === "application"
      : ["prediction", "changed_case"].includes(s.phase)) &&
    typeof s.streamId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      s.streamId,
    ) &&
    Number.isInteger(s.count) &&
    s.count >= 0 &&
    s.count <= 20 &&
    typeof s.assistance === "boolean" &&
    outcome(s.first) &&
    outcome(s.latest) &&
    (s.count === 0) === (s.first === null) &&
    (s.count === 0) === (s.latest === null) &&
    (s.count !== 1 ||
      (s.first?.correct === s.latest?.correct &&
        s.first?.assisted === s.latest?.assisted)) &&
    (!(s.first?.assisted || s.latest?.assisted) || s.assistance) &&
    (s.completedAt === null ||
      (typeof s.completedAt === "string" &&
        Number.isFinite(Date.parse(s.completedAt)) &&
        s.count > 0))
  );
}
export function activityEvidenceLabel(row: ActivitySummary) {
  if (row.first_assisted === null && row.attempt_count > 0)
    return row.completed_at || row.latest_correct
      ? "Earlier completion; assistance not recorded"
      : "Earlier attempt; assistance not recorded";
  const spec = Object.prototype.hasOwnProperty.call(
    LEARNING_ACTIVITIES,
    row.activity_id,
  )
    ? LEARNING_ACTIVITIES[row.activity_id as LearningActivityId]
    : null;
  let label: string;
  if (row.source === "learner_report")
    label = row.latest_correct
      ? "External run reported"
      : "External run needs another check";
  else if (row.phase === "changed_case" && row.latest_correct)
    label = row.latest_assisted
      ? "Changed case passed with help"
      : "Changed case passed";
  else if (row.latest_correct)
    label = row.latest_assisted ? "Practised with help" : "Prediction matched";
  else label = row.attempt_count ? "Needs another look" : "Reference viewed";
  if (spec && row.content_version === spec.version) return label;
  return `${spec && row.content_version < spec.version ? "Earlier activity version" : "Different activity version"}: ${label}`;
}
