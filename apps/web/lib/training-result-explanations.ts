import type { ExerciseArtifact } from "@tensorcraft/ui";

type Table = Extract<ExerciseArtifact, { kind: "table" }>;
type Series = Extract<ExerciseArtifact, { kind: "series" }>;
export const LOSS_CASES = [
  "Confident and correct",
  "Confident and wrong",
] as const;
export const HISTORY_LABELS = [
  "insufficient-history",
  "validation-improving",
  "both-worsening",
  "train-down-validation-up",
  "validation-worsening",
  "plateau",
] as const;
export type HistoryLabel = (typeof HISTORY_LABELS)[number];
export type LossComparisonResult = {
  kind: "loss-comparison";
  mse: {
    rows: { position: number; label: number; prediction: number }[];
    returned: number;
  } | null;
  bce:
    | {
        name: string;
        returned: number;
        rows: { position: number; label: 0 | 1; logit: number }[];
      }[]
    | null;
};
export type ScalarUpdatesResult = {
  kind: "scalar-updates";
  first: { rate: number; gradient: number; after: number };
  steps: {
    update: number;
    before: number;
    gradient: number;
    rate: number;
    after: number;
    loss: number;
  }[];
};
export type TrainingHistoryResult = {
  kind: "training-history";
  epochs: number;
  samples: { epoch: number; training: number; validation: number }[];
  windows: null | {
    previous: [number, number];
    recent: [number, number];
    training: [number, number];
    validation: [number, number];
  };
  status: "returned" | "invalid" | "threw";
  returned: HistoryLabel | null;
  detail: string;
};
export type TrainingResult =
  LossComparisonResult | ScalarUpdatesResult | TrainingHistoryResult;
export const supportsTrainingResult = (slug: string) =>
  ["mse-loss", "gradient-step", "training-loop-exercise"].includes(slug);
const same = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);
function one(artifacts: ExerciseArtifact[], title: string) {
  const matches = artifacts.filter((artifact) => artifact.title === title);
  return matches.length === 1 ? matches[0]! : null;
}
function table(
  artifacts: ExerciseArtifact[],
  title: string,
  columns: string[],
): Table | null {
  const value = one(artifacts, title);
  return value?.kind === "table" && same(value.columns, columns) ? value : null;
}
const numeric = (values: readonly unknown[]): values is number[] =>
  values.every((value) => typeof value === "number" && Number.isFinite(value));

function lossResult(
  artifacts: ExerciseArtifact[],
): LossComparisonResult | null {
  let mse: LossComparisonResult["mse"] = null;
  let bce: LossComparisonResult["bce"] = null;
  const mseTitle = "Inputs and your returned MSE";
  if (artifacts.some((item) => item.title === mseTitle)) {
    const value = table(artifacts, mseTitle, [
      "Position",
      "Label",
      "Prediction",
      "Returned batch MSE",
    ]);
    if (
      !value ||
      value.rows.length !== 4 ||
      value.rows.some(
        (row, i) =>
          !numeric(row) || row[0] !== i + 1 || row[3] !== value.rows[0]![3],
      )
    )
      return null;
    mse = {
      rows: value.rows.map((row) => ({
        position: row[0] as number,
        label: row[1] as number,
        prediction: row[2] as number,
      })),
      returned: value.rows[0]![3] as number,
    };
  }
  const comparisonTitle = "Farah's loss comparison";
  const operandsTitle = "Logits used for your loss comparison";
  if (
    artifacts.some((item) =>
      [comparisonTitle, operandsTitle].includes(item.title),
    )
  ) {
    const comparison = table(artifacts, comparisonTitle, ["Test case", "Loss"]);
    const operands = table(artifacts, operandsTitle, [
      "Test case",
      "Position",
      "Label",
      "Logit",
    ]);
    if (
      !comparison ||
      !operands ||
      comparison.rows.length !== 2 ||
      operands.rows.length !== 4
    )
      return null;
    if (
      comparison.rows.some(
        (row, i) => row[0] !== LOSS_CASES[i] || !numeric(row.slice(1)),
      )
    )
      return null;
    if (
      operands.rows.some(
        (row, i) =>
          row[0] !== LOSS_CASES[Math.floor(i / 2)] ||
          row[1] !== (i % 2) + 1 ||
          ![0, 1].includes(row[2] as number) ||
          !numeric(row.slice(1)),
      )
    )
      return null;
    bce = LOSS_CASES.map((name, index) => ({
      name,
      returned: comparison.rows[index]![1] as number,
      rows: operands.rows.slice(index * 2, index * 2 + 2).map((row) => ({
        position: row[1] as number,
        label: row[2] as 0 | 1,
        logit: row[3] as number,
      })),
    }));
  }
  return mse || bce ? { kind: "loss-comparison", mse, bce } : null;
}

function scalarResult(
  artifacts: ExerciseArtifact[],
): ScalarUpdatesResult | null {
  const first = table(artifacts, "Your first weight update", [
    "Learning rate",
    "Stored gradient",
    "Updated weight",
  ]);
  const values = table(artifacts, "Operands from your next two updates", [
    "Update",
    "Weight before",
    "Stored gradient",
    "Learning rate",
    "Weight after",
    "Loss after",
  ]);
  const trace = one(artifacts, "The weight after three of your steps");
  if (
    !first ||
    first.rows.length !== 1 ||
    !numeric(first.rows[0]!) ||
    !values ||
    values.rows.length !== 2 ||
    values.rows.some((row, i) => !numeric(row) || row[0] !== i + 2)
  )
    return null;
  if (
    trace?.kind !== "series" ||
    trace.xLabel !== "Update" ||
    trace.yLabel !== "Weight" ||
    !same(trace.labels, ["1", "2", "3"]) ||
    trace.series.length !== 1 ||
    trace.series[0]!.name !== "Weight"
  )
    return null;
  const weights = (trace as Series).series[0]!.values;
  if (
    weights[0] !== first.rows[0]![2] ||
    values.rows.some(
      (row, i) => row[1] !== weights[i] || row[4] !== weights[i + 1],
    )
  )
    return null;
  return {
    kind: "scalar-updates",
    first: {
      rate: first.rows[0]![0] as number,
      gradient: first.rows[0]![1] as number,
      after: first.rows[0]![2] as number,
    },
    steps: values.rows.map((row) => ({
      update: row[0] as number,
      before: row[1] as number,
      gradient: row[2] as number,
      rate: row[3] as number,
      after: row[4] as number,
      loss: row[5] as number,
    })),
  };
}

const HISTORY_ROWS = [
  "Completed epochs",
  "Previous window first epoch",
  "Previous window last epoch",
  "Recent window first epoch",
  "Recent window last epoch",
  "Training previous mean",
  "Training recent mean",
  "Validation previous mean",
  "Validation recent mean",
  "Diagnosis status",
  "Returned diagnosis",
  "Diagnosis detail",
];
function historyResult(
  artifacts: ExerciseArtifact[],
): TrainingHistoryResult | null {
  const diagnosis = table(artifacts, "Your full-history diagnosis", [
    "Measure",
    "Value",
  ]);
  const curve = one(artifacts, "Your training and validation losses");
  if (
    !diagnosis ||
    !same(
      diagnosis.rows.map((row) => row[0]),
      HISTORY_ROWS,
    ) ||
    curve?.kind !== "series" ||
    curve.xLabel !== "Epoch" ||
    curve.yLabel !== "Loss" ||
    !same(
      curve.series.map((row) => row.name),
      ["Training", "Validation"],
    )
  )
    return null;
  const values = diagnosis.rows.map((row) => row[1]);
  const epochs = values[0];
  if (
    typeof epochs !== "number" ||
    !Number.isSafeInteger(epochs) ||
    epochs < 1 ||
    epochs > 500
  )
    return null;
  const shown = Math.min(64, epochs);
  const epochNumbers = Array.from(
    { length: shown },
    (_, i) => Math.round((i * (epochs - 1)) / Math.max(1, shown - 1)) + 1,
  );
  if (
    !same(curve.labels, epochNumbers.map(String)) ||
    curve.series.some((row) => row.values.some((value) => value < 0))
  )
    return null;
  let windows: TrainingHistoryResult["windows"] = null;
  if (epochs < 20) {
    if (!values.slice(1, 9).every((value) => value === null)) return null;
  } else {
    if (
      !same(values.slice(1, 5), [
        epochs - 19,
        epochs - 10,
        epochs - 9,
        epochs,
      ]) ||
      !numeric(values.slice(5, 9)) ||
      values.slice(5, 9).some((value) => (value as number) < 0)
    )
      return null;
    windows = {
      previous: [epochs - 19, epochs - 10],
      recent: [epochs - 9, epochs],
      training: [values[5] as number, values[6] as number],
      validation: [values[7] as number, values[8] as number],
    };
  }
  const status = values[9],
    returned = values[10],
    detail = values[11];
  if (
    !["returned", "invalid", "threw"].includes(status as string) ||
    typeof detail !== "string" ||
    detail.length > 500
  )
    return null;
  if (
    status === "returned"
      ? !HISTORY_LABELS.includes(returned as HistoryLabel)
      : returned !== null
  )
    return null;
  return {
    kind: "training-history",
    epochs,
    windows,
    samples: epochNumbers.map((epoch, i) => ({
      epoch,
      training: curve.series[0]!.values[i]!,
      validation: curve.series[1]!.values[i]!,
    })),
    status: status as TrainingHistoryResult["status"],
    returned: returned as HistoryLabel | null,
    detail,
  };
}

/** Inputs have already passed the bounded shared artifact validator. */
export function readTrainingResult(
  slug: string,
  artifacts: ExerciseArtifact[],
): TrainingResult | null {
  if (slug === "mse-loss") return lossResult(artifacts);
  if (slug === "gradient-step") return scalarResult(artifacts);
  if (slug === "training-loop-exercise") return historyResult(artifacts);
  return null;
}

export function windowTrend(previous: number, recent: number) {
  if (previous === 0) return recent === 0 ? "flat" : "up";
  if (recent < previous * 0.95 - 1e-12) return "down";
  if (recent > previous * 1.05 + 1e-12) return "up";
  return "flat";
}
export function expectedHistoryLabel(
  result: Pick<TrainingHistoryResult, "windows">,
): HistoryLabel {
  if (!result.windows) return "insufficient-history";
  const training = windowTrend(...result.windows.training);
  const validation = windowTrend(...result.windows.validation);
  if (validation === "down") return "validation-improving";
  if (validation === "up" && training === "up") return "both-worsening";
  if (validation === "up" && training === "down")
    return "train-down-validation-up";
  return validation === "up" ? "validation-worsening" : "plateau";
}
