import {
  readCourseResult,
  supportsCourseResult,
  type CourseResult,
} from "./course-result-explanations";
import type { ExerciseArtifact } from "@tensorcraft/ui";
import { validateArtifacts } from "../../../packages/ui/src/mdx/exercise-artifacts.mjs";
import {
  WORKED_EXCERPT,
  WORKED_PACKET,
} from "../app/components/mdx/channel-layout-data";
import {
  readTrainingResult,
  supportsTrainingResult,
  type TrainingResult,
} from "./training-result-explanations";
import {
  readRuntimeResult,
  supportsRuntimeResult,
  type RuntimeResult,
} from "./runtime-result-explanations";

type Table = Extract<ExerciseArtifact, { kind: "table" }>;
type Series = Extract<ExerciseArtifact, { kind: "series" }>;

export type SensorResult = {
  kind: "sensor-layout";
  operation: "create" | "arrange";
  artifactIndex: number;
  sourceId: string;
  sensors: readonly string[];
  sourceRows: readonly (readonly number[])[];
  labels: string[];
  series: Series["series"];
};

export type GradientResult = {
  kind: "gradient-comparison";
  variables: { name: string; automatic: number; numerical: number }[];
  automaticCalls: number;
  numericalCalls: number;
};

export type DenseForwardResult = {
  kind: "dense-forward";
  readings: {
    id: number;
    inputs: [number, number];
    outputs: [number, number, number];
  }[];
  kernel: [[number, number, number], [number, number, number]];
  bias: [number, number, number];
};

export type LessonResultExplanation =
  | SensorResult
  | GradientResult
  | DenseForwardResult
  | TrainingResult
  | RuntimeResult
  | CourseResult;

export function supportsLessonResultExplanation(slug: string) {
  return (
    supportsCourseResult(slug) ||
    supportsTrainingResult(slug) ||
    supportsRuntimeResult(slug) ||
    [
      "create-a-tensor",
      "reshape-tensor",
      "backprop-chain",
      "forward-pass",
    ].includes(slug)
  );
}

function single<T extends ExerciseArtifact["kind"]>(
  artifacts: ExerciseArtifact[],
  kind: T,
  title: string,
): { artifact: Extract<ExerciseArtifact, { kind: T }>; index: number } | null {
  const found = artifacts.flatMap((artifact, index) =>
    artifact.title === title ? [{ artifact, index }] : [],
  );
  if (found.length !== 1 || found[0]!.artifact.kind !== kind) return null;
  return found[0] as {
    artifact: Extract<ExerciseArtifact, { kind: T }>;
    index: number;
  };
}

const same = (actual: readonly string[], expected: readonly string[]) =>
  actual.length === expected.length &&
  actual.every((v, i) => v === expected[i]);

function columns(table: Table, expected: string[]) {
  return same(table.columns, expected);
}

function sensorResult(
  slug: string,
  artifacts: ExerciseArtifact[],
): SensorResult | null {
  const found = single(
    artifacts,
    "series",
    slug === "create-a-tensor"
      ? "Demir’s readings on the chart"
      : "Farah’s chart from your arrangement",
  );
  if (!found) return null;
  const chart = found.artifact;
  if (
    chart.xLabel !== "Selected moment" ||
    chart.yLabel !== "Recorded reading" ||
    !same(chart.labels, ["1", "2", "3"]) ||
    chart.series.length !== WORKED_EXCERPT.sensorIds.length ||
    !same(
      chart.series.map((row) => row.name),
      WORKED_EXCERPT.sensorIds.map((sensor) => `Sensor ${sensor}`),
    )
  )
    return null;
  return {
    kind: "sensor-layout",
    operation: slug === "create-a-tensor" ? "create" : "arrange",
    artifactIndex: found.index,
    sourceId: WORKED_EXCERPT.sourceId,
    sensors: WORKED_EXCERPT.sensorIds,
    sourceRows: WORKED_PACKET.map((row) => [...row]),
    labels: chart.labels,
    series: chart.series,
  };
}

function gradientResult(artifacts: ExerciseArtifact[]): GradientResult | null {
  const values = single(
    artifacts,
    "table",
    "Your two gradient methods",
  )?.artifact;
  const counts = single(
    artifacts,
    "table",
    "Forward calculations needed for those gradients",
  )?.artifact;
  if (
    !values ||
    !counts ||
    !columns(values, [
      "Variable",
      "Automatic gradient",
      "Numerical estimate",
    ]) ||
    !columns(counts, ["Method", "Forward calculations"]) ||
    values.rows.length !== 3 ||
    counts.rows.length !== 2
  )
    return null;
  const variables: GradientResult["variables"] = [];
  for (const [name, automatic, numerical] of values.rows) {
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof automatic !== "number" ||
      typeof numerical !== "number"
    )
      return null;
    variables.push({ name, automatic, numerical });
  }
  if (
    new Set(variables.map((row) => row.name)).size !== variables.length ||
    counts.rows[0]![0] !== "Automatic differentiation" ||
    counts.rows[1]![0] !== "Numerical estimates"
  )
    return null;
  const automaticCalls = counts.rows[0]![1];
  const numericalCalls = counts.rows[1]![1];
  if (
    typeof automaticCalls !== "number" ||
    typeof numericalCalls !== "number" ||
    !Number.isSafeInteger(automaticCalls) ||
    !Number.isSafeInteger(numericalCalls) ||
    automaticCalls < 1 ||
    numericalCalls < 1
  )
    return null;
  return {
    kind: "gradient-comparison",
    variables,
    automaticCalls,
    numericalCalls,
  };
}

function denseForwardResult(
  artifacts: ExerciseArtifact[],
): DenseForwardResult | null {
  const values = single(
    artifacts,
    "table",
    "Your first forward pass",
  )?.artifact;
  const weights = single(
    artifacts,
    "table",
    "Weights used for this forward pass",
  )?.artifact;
  if (
    !values ||
    !weights ||
    !columns(values, [
      "Reading",
      "Input 1",
      "Input 2",
      "Unit 1",
      "Unit 2",
      "Unit 3",
    ]) ||
    !columns(weights, ["Parameter", "Unit 1", "Unit 2", "Unit 3"]) ||
    values.rows.length !== 2 ||
    weights.rows.length !== 3 ||
    !same(
      weights.rows.map((row) => String(row[0])),
      ["Input 1", "Input 2", "Bias"],
    ) ||
    values.rows.some(
      (row, index) =>
        row[0] !== index + 1 || row.some((cell) => typeof cell !== "number"),
    ) ||
    weights.rows.some((row) =>
      row.slice(1).some((cell) => typeof cell !== "number"),
    )
  )
    return null;
  return {
    kind: "dense-forward",
    readings: values.rows.map((row) => ({
      id: row[0] as number,
      inputs: row.slice(1, 3) as [number, number],
      outputs: row.slice(3) as [number, number, number],
    })),
    kernel: weights.rows
      .slice(0, 2)
      .map((row) => row.slice(1)) as DenseForwardResult["kernel"],
    bias: weights.rows[2]!.slice(1) as DenseForwardResult["bias"],
  };
}

/** Decode only known, bounded captures. A readable report cannot certify authorship. */
export function readLessonResultExplanation(
  slug: string,
  rawArtifacts: unknown,
): LessonResultExplanation | null {
  if (!supportsLessonResultExplanation(slug)) return null;
  let artifacts: ExerciseArtifact[];
  try {
    artifacts = validateArtifacts(rawArtifacts);
  } catch {
    return null;
  }
  if (supportsCourseResult(slug)) return readCourseResult(slug, artifacts);
  if (slug === "backprop-chain") return gradientResult(artifacts);
  if (slug === "forward-pass") return denseForwardResult(artifacts);
  if (supportsTrainingResult(slug)) return readTrainingResult(slug, artifacts);
  if (supportsRuntimeResult(slug)) return readRuntimeResult(slug, artifacts);
  return sensorResult(slug, artifacts);
}
