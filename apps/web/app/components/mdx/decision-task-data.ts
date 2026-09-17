export interface DecisionTaskSpec {
  title: string;
  brief: string;
  options: { id: string; text: string }[];
  correct: string;
  counts?: readonly {
    policy: string;
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  }[];
  number?: { label: string; byChoice: Record<string, number> };
  evidencePrompt: string;
  explanation: string;
}
const policyCounts = [
  { policy: "Never flag", tp: 0, fp: 0, tn: 90, fn: 10 },
  { policy: "Model", tp: 8, fp: 12, tn: 78, fn: 2 },
  { policy: "Simple rule", tp: 5, fp: 2, tn: 88, fn: 5 },
] as const;
export const DECISIONS: Record<string, DecisionTaskSpec> = {
  "future-builds": {
    title: "Decision: evaluate next week's builds",
    brief:
      "You will predict failure when a build starts, for the same service next week. You have six weeks of time-stamped records. Duration is recorded only after a build finishes. Choose an evaluation plan before fitting anything.",
    options: [
      {
        id: "random",
        text: "Shuffle all rows, scale the whole archive, then split. Include duration because it predicts failure.",
      },
      {
        id: "time",
        text: "Train on earlier weeks, choose settings on a later validation period, then evaluate once on the final period. Exclude duration and fit scaling on training rows.",
      },
      {
        id: "test-selection",
        text: "Use chronological periods and training-only scaling, but try models until the final-period score is best.",
      },
    ],
    correct: "time",
    evidencePrompt:
      "Explain why your plan matches the prediction time. Name one change in the intended deployment that would require a different evaluation design.",
    explanation:
      "The chronological plan measures performance on later records. Duration is unavailable at prediction time. Using the final period to select a model makes it development data. Predicting for a new service would also need evidence about transfer across services; time order alone cannot establish that.",
  },
  "review-costs": {
    title: "Decision: choose a review policy",
    brief:
      "Three policies were evaluated on the same 100 validation builds, including 10 failures. A missed failure costs 8 minutes; an unnecessary review costs 1 minute. Count only these two error costs. Choose the lowest-cost policy before evaluating it on the final period.",
    options: [
      { id: "baseline", text: "Never flag a build" },
      { id: "model", text: "Use the model" },
      { id: "rule", text: "Use the simple rule" },
    ],
    correct: "model",
    counts: policyCounts,
    number: {
      label: "Total error cost of your chosen policy (minutes)",
      byChoice: { baseline: 80, model: 28, rule: 42 },
    },
    evidencePrompt:
      "Show the two error counts in your calculation. Explain why accuracy alone would choose differently and what still needs checking on the final period.",
    explanation:
      "Costs are 80 minutes for never flagging, 28 for the model (2 × 8 + 12), and 42 for the rule. The model wins this stated comparison despite lower accuracy than the other two. Final-period results and the assumptions behind the costs still matter.",
  },
  "rule-or-model": {
    title: "Decision: when the rule wins",
    brief:
      "Keep the same validation predictions. The team now estimates 4 minutes per missed failure and 3 minutes per unnecessary review. No other costs change. Choose the lowest-cost policy for this revised decision.",
    options: [
      { id: "model", text: "Keep the trained model" },
      { id: "rule", text: "Use the simple rule" },
      { id: "baseline", text: "Never flag a build" },
    ],
    correct: "rule",
    counts: policyCounts,
    number: {
      label: "Total error cost of your chosen policy (minutes)",
      byChoice: { baseline: 40, model: 44, rule: 26 },
    },
    evidencePrompt:
      "Show your calculation. Explain whether you need to retrain to compare these fixed policies, and what evidence would justify a later switch.",
    explanation:
      "Costs are 40 for never flagging, 44 for the model and 26 for the rule (5 × 4 + 2 × 3). Changing the decision costs does not require retraining to compare these fixed predictions. Selecting a new model or threshold would require validation followed by a fresh final evaluation.",
  },
};
export interface DecisionAttempt {
  choice: string;
  calculation: string;
  rationale: string;
  help: string;
  minutes: string;
  submittedAt: string;
}
export interface DecisionDraft {
  version: 1;
  id: string;
  choice: string;
  calculation: string;
  rationale: string;
  help: string;
  minutes: string;
  attempts: DecisionAttempt[];
}
export function decisionDraft(id: string): DecisionDraft {
  return {
    version: 1,
    id,
    choice: "",
    calculation: "",
    rationale: "",
    help: "",
    minutes: "",
    attempts: [],
  };
}
export function readyToSubmit(d: DecisionDraft): boolean {
  const spec = DECISIONS[d.id];
  return Boolean(
    spec &&
    spec.options.some((o) => o.id === d.choice) &&
    d.rationale.trim() &&
    d.help.trim() &&
    d.minutes.trim() &&
    Number.isFinite(Number(d.minutes)) &&
    Number(d.minutes) >= 0 &&
    (!spec.number ||
      (d.calculation.trim() && Number.isFinite(Number(d.calculation)))),
  );
}
export function checkDecision(id: string, attempt: DecisionAttempt) {
  const spec = DECISIONS[id];
  return {
    choiceCorrect: attempt.choice === spec.correct,
    calculationCorrect:
      !spec.number ||
      (attempt.calculation.trim() !== "" &&
        Number(attempt.calculation) === spec.number.byChoice[attempt.choice]),
  };
}
export function parseDecision(text: string, id: string): DecisionDraft {
  if (text.length > 250_000) throw new Error("Draft too large");
  const value = JSON.parse(text);
  const validFields = (v: DecisionAttempt | DecisionDraft) =>
    v &&
    ["choice", "calculation", "rationale", "help", "minutes"].every(
      (k) =>
        typeof (v as unknown as Record<string, unknown>)[k] === "string" &&
        (v as unknown as Record<string, string>)[k].length <= 5000,
    );
  if (
    !DECISIONS[id] ||
    value?.version !== 1 ||
    value.id !== id ||
    !validFields(value) ||
    !Array.isArray(value.attempts) ||
    value.attempts.length > 20 ||
    !value.attempts.every(
      (a: DecisionAttempt) =>
        validFields(a) &&
        typeof a.submittedAt === "string" &&
        Number.isFinite(Date.parse(a.submittedAt)),
    )
  )
    throw new Error("Invalid decision draft");
  return value;
}
