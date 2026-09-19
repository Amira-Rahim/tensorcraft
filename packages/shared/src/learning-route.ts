export const ML_LEARNING_ROUTES = ["guided", "challenge"] as const;
export type MLLearningRoute = (typeof ML_LEARNING_ROUTES)[number];
export function isMLLearningRoute(value: unknown): value is MLLearningRoute {
  return value === "guided" || value === "challenge";
}

/** Prerequisites guide study; they never replace the purchase check. */
export function canOpenLearningModule(order: number, entitled: boolean) {
  return Number.isInteger(order) && order > 0 && (order === 1 || entitled);
}

export const ML_READINESS_QUESTIONS = [
  {
    id: "shape",
    question:
      "Rows are times and columns are sensors. The plotter needs one row per sensor. What preserves each sensor's readings?",
    options: [
      "Transpose the two axes",
      "Reshape to the target dimensions",
      "Sort all the values",
    ],
    correct: 0,
    explanation:
      "Transpose swaps axis meanings. Reshape keeps flat order and can mix sensor channels.",
    review: {
      module: "foundations",
      lesson: "tensor-shapes",
      label: "Channel layout",
    },
  },
  {
    id: "split",
    question:
      "You will predict future readings. When should you fit preprocessing statistics?",
    options: [
      "On every row, before splitting",
      "On the training period only",
      "Separately on each incoming reading",
    ],
    correct: 1,
    explanation:
      "Keep future evaluation data out of preprocessing fits. Reuse the saved training statistics at inference.",
    review: {
      module: "foundations",
      lesson: "normalization",
      label: "Training-only preprocessing",
    },
  },
  {
    id: "evaluation",
    question:
      "A classifier gets 95% accuracy where 95% of cases are negative. What does that establish?",
    options: [
      "It is ready to deploy",
      "It recognizes nearly every positive",
      "Accuracy alone has not shown improvement over always predicting negative",
    ],
    correct: 2,
    explanation:
      "Compare with a baseline and inspect missed positives and false alarms on suitable held-out data.",
    review: {
      module: "training-loop",
      lesson: "evaluating-deep-scan",
      label: "Evaluation and baselines",
    },
  },
  {
    id: "inference",
    question:
      "A model works before reload but produces different scores afterward. What should you check first?",
    options: [
      "Train for more epochs",
      "Model version, feature order, and saved preprocessing",
      "Raise every prediction score",
    ],
    correct: 1,
    explanation:
      "Inference needs the same artifact and input contract. More training cannot repair a swapped feature order or scaler.",
    review: {
      module: "browser-runtimes",
      lesson: "model-loading",
      label: "Artifact loading",
    },
  },
] as const;

export function readinessGaps(answers: readonly (number | null)[]) {
  return ML_READINESS_QUESTIONS.filter(
    (question, index) => answers[index] !== question.correct,
  );
}
