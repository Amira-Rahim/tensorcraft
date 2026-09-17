export const ASSIGNMENT_VERSION = "build-triage-v1";
export const DRAFT_KEY = `tensorcraft:assignment:${ASSIGNMENT_VERSION}`;

export const REPORT_FIELDS = [
  {
    id: "decision",
    label: "Decision and error costs",
    prompt: "What will a prediction change? Which mistakes matter?",
  },
  {
    id: "data",
    label: "Features and time split",
    prompt:
      "Record excluded columns, split boundaries, row counts, failure rates and how you fitted preprocessing.",
  },
  {
    id: "baseline",
    label: "Baseline and chosen metric",
    prompt:
      "What simple method will you compare against? Choose the metric before comparing results.",
  },
  {
    id: "experiment",
    label: "Model and reproducible run",
    prompt:
      "Record architecture, settings, versions, commands and where you kept the runnable code.",
  },
  {
    id: "results",
    label: "Validation and final results",
    prompt:
      "Compare baseline and model. Include counts for true positives, false positives, true negatives and false negatives.",
  },
  {
    id: "errors",
    label: "Errors and recommendation",
    prompt:
      "Inspect at least three errors, or all if fewer. Does the model earn its complexity? What would you need to test next?",
  },
  {
    id: "help",
    label: "Help used",
    prompt:
      "List lesson examples, AI, other people or other assistance. Write None if you used no help.",
  },
] as const;
export type ReportField = (typeof REPORT_FIELDS)[number]["id"];
export const REVIEW_CHECKS = [
  "Every input would exist when a build starts; outcome fields are excluded.",
  "Preprocessing uses training rows only; the final period did not guide model selection.",
  "Baseline and model use the same evaluation rows and metric.",
  "My report includes error cases, limitations and enough detail to rerun the code.",
] as const;
export const RESCUES = [
  {
    id: "split",
    title: "I need help with the split",
    body: "Sort by start time. Reserve a later period for final evaluation and an earlier held-out period for decisions. Keep their row IDs separate from training before fitting any preprocessing. Report the failure rate of each period.",
  },
  {
    id: "baseline",
    title: "I need help with the baseline",
    body: "Try predicting the training set's majority class for every row. A second baseline could be a rule chosen on training and validation data. Count both missed failures and unnecessary reviews; accuracy alone can hide missed failures.",
  },
  {
    id: "model",
    title: "I need help getting a model running",
    body: "Start with a small dense classifier and one sigmoid output. Fit feature scaling on training rows. Use binary cross-entropy for the binary target, inspect validation results, then freeze settings before the final evaluation. Dispose tensors when finished.",
  },
] as const;
export type RescueId = (typeof RESCUES)[number]["id"];

export interface TransferDraft {
  version: typeof ASSIGNMENT_VERSION;
  answers: Record<ReportField, string>;
  checks: boolean[];
  openedRescues: RescueId[];
  selfReviewedAt: string | null;
}
export function emptyDraft(): TransferDraft {
  return {
    version: ASSIGNMENT_VERSION,
    answers: Object.fromEntries(
      REPORT_FIELDS.map(({ id }) => [id, ""]),
    ) as Record<ReportField, string>,
    checks: REVIEW_CHECKS.map(() => false),
    openedRescues: [],
    selfReviewedAt: null,
  };
}
export function canSelfReview(draft: TransferDraft): boolean {
  return (
    REPORT_FIELDS.every(({ id }) => draft.answers[id].trim().length > 0) &&
    draft.checks.length === REVIEW_CHECKS.length &&
    draft.checks.every(Boolean)
  );
}
// Imported reports are untrusted input. They never earn XP or an assessment pass.
export function parseDraft(text: string): TransferDraft {
  if (text.length > 100_000) throw new Error("This report is too large.");
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object") throw new Error("Invalid report.");
  const d = value as TransferDraft;
  if (
    d.version !== ASSIGNMENT_VERSION ||
    !d.answers ||
    !REPORT_FIELDS.every(
      ({ id }) =>
        typeof d.answers[id] === "string" && d.answers[id].length <= 10_000,
    ) ||
    !Array.isArray(d.checks) ||
    d.checks.length !== REVIEW_CHECKS.length ||
    !d.checks.every((v) => typeof v === "boolean") ||
    !Array.isArray(d.openedRescues) ||
    !d.openedRescues.every((id) => RESCUES.some((r) => r.id === id)) ||
    !(
      d.selfReviewedAt === null ||
      (typeof d.selfReviewedAt === "string" &&
        Number.isFinite(Date.parse(d.selfReviewedAt)))
    )
  ) {
    throw new Error(
      "Choose a build-triage-v1 report exported from this assignment.",
    );
  }
  const clean: TransferDraft = {
    version: ASSIGNMENT_VERSION,
    answers: Object.fromEntries(
      REPORT_FIELDS.map(({ id }) => [id, d.answers[id]]),
    ) as Record<ReportField, string>,
    checks: [...d.checks],
    openedRescues: [...new Set(d.openedRescues)],
    selfReviewedAt: d.selfReviewedAt,
  };
  if (!canSelfReview(clean)) clean.selfReviewedAt = null;
  return clean;
}
