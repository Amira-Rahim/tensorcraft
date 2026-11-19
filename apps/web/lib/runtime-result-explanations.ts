import type { ExerciseArtifact } from "@tensorcraft/ui";

export type PolicyResult = {
  kind: "deployment-policy";
  cases: {
    source: string;
    size: number;
    latency: number;
    sensitive: boolean;
    offline: boolean;
    returned: string;
  }[];
};
export type InferenceResult = {
  kind: "inference-trace";
  features: {
    key: string;
    raw: number;
    min: number;
    max: number;
    observed: number;
  }[];
  output: number;
  returned: string;
  score: number;
  memory: { before: number; after: number } | null;
};
export type CapacityResult = {
  kind: "capacity-estimate";
  first: { time: number; count: number };
  last: { time: number; count: number };
  budget: number;
  returned: { growing: boolean; rate: number; hours: number };
};
export type ReportsResult = {
  kind: "report-pairing";
  supplied: { position: number; text: string; label: string; score: number }[];
  returned: { text: string; label: string; score: number }[];
};
export type RuntimeParityResult = {
  kind: "runtime-parity";
  runs: { name: string; inputs: number[]; output: number }[];
  returned: boolean;
  tfjsMs: number;
  onnxMs: number;
};
export type RuntimeResult =
  | PolicyResult
  | InferenceResult
  | CapacityResult
  | ReportsResult
  | RuntimeParityResult;
const slugs = [
  "browser-ml-tradeoffs",
  "inference-pipeline",
  "incident-tensor-leak",
  "load-pretrained-pipeline",
  "onnx-comparison",
];
export const supportsRuntimeResult = (slug: string) => slugs.includes(slug);
const same = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
const numeric = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const words = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= 500;
function table(
  artifacts: ExerciseArtifact[],
  title: string,
  columns: string[],
) {
  const items = artifacts.filter((row) => row.title === title);
  const value = items[0];
  return items.length === 1 &&
    value?.kind === "table" &&
    same(value.columns, columns)
    ? value
    : null;
}
function policy(artifacts: ExerciseArtifact[]): PolicyResult | null {
  const cases: PolicyResult["cases"] = [];
  for (const [title, count] of [
    ["Local requirements in your policy probe", 3],
    ["Boundary inputs in your policy probe", 2],
  ] as const) {
    if (!artifacts.some((row) => row.title === title)) continue;
    const value = table(artifacts, title, [
      "Model MB",
      "Latency preference ms",
      "Sensitive input",
      "Offline required",
      "Returned recommendation",
    ]);
    if (
      !value ||
      value.rows.length !== count ||
      value.rows.some(
        (row) =>
          !numeric(row[0]) ||
          row[0] < 0 ||
          !numeric(row[1]) ||
          row[1] < 0 ||
          typeof row[2] !== "boolean" ||
          typeof row[3] !== "boolean" ||
          !words(row[4]),
      )
    )
      return null;
    cases.push(
      ...value.rows.map((row) => ({
        source: title,
        size: row[0] as number,
        latency: row[1] as number,
        sensitive: row[2] as boolean,
        offline: row[3] as boolean,
        returned: row[4] as string,
      })),
    );
  }
  return cases.length ? { kind: "deployment-policy", cases } : null;
}
function inference(artifacts: ExerciseArtifact[]): InferenceResult | null {
  const input = table(
    artifacts,
    "Raw fields and input values from your handler",
    [
      "Feature key",
      "Raw input",
      "Reference min",
      "Reference max",
      "Observed scaled input",
    ],
  );
  const output = table(
    artifacts,
    "The probe output and your returned decision",
    ["Observed model output", "Returned class", "Selected class score"],
  );
  if (
    !input ||
    !output ||
    input.rows.length !== 3 ||
    output.rows.length !== 1 ||
    !same(
      input.rows.map((row) => row[0]),
      ["amplitude", "frequency", "phase"],
    ) ||
    input.rows.some(
      (row) =>
        !row.slice(1).every(numeric) ||
        (row[3] as number) <= (row[2] as number),
    )
  )
    return null;
  const row = output.rows[0]!;
  if (!numeric(row[0]) || !words(row[1]) || !numeric(row[2])) return null;
  let memory: InferenceResult["memory"] = null;
  const memoryTitle = "Tensor count around your prediction";
  if (artifacts.some((item) => item.title === memoryTitle)) {
    const counts = table(artifacts, memoryTitle, ["Before call", "After call"]);
    if (
      !counts ||
      counts.rows.length !== 1 ||
      counts.rows[0]!.some(
        (v) => !numeric(v) || !Number.isSafeInteger(v) || v < 0,
      )
    )
      return null;
    memory = {
      before: counts.rows[0]![0] as number,
      after: counts.rows[0]![1] as number,
    };
  }
  return {
    kind: "inference-trace",
    features: input.rows.map((row) => ({
      key: row[0] as string,
      raw: row[1] as number,
      min: row[2] as number,
      max: row[3] as number,
      observed: row[4] as number,
    })),
    output: row[0],
    returned: row[1],
    score: row[2],
    memory,
  };
}
function capacity(artifacts: ExerciseArtifact[]): CapacityResult | null {
  const input = table(
    artifacts,
    "Endpoints supplied for your capacity estimate",
    ["Endpoint", "Hours", "Tensor count", "Budget tensors"],
  );
  const output = table(artifacts, "Your capacity estimate for the watch", [
    "Growing",
    "Tensors per hour",
    "Hours to budget",
  ]);
  if (
    !input ||
    !output ||
    input.rows.length !== 2 ||
    output.rows.length !== 1 ||
    !same(
      input.rows.map((row) => row[0]),
      ["First", "Last"],
    ) ||
    input.rows.some((row) => !row.slice(1).every(numeric))
  )
    return null;
  const first = input.rows[0]!,
    last = input.rows[1]!,
    row = output.rows[0]!;
  if (
    (last[1] as number) <= (first[1] as number) ||
    (first[2] as number) < 0 ||
    (last[2] as number) < 0 ||
    first[3] !== last[3] ||
    (last[3] as number) <= (last[2] as number) ||
    typeof row[0] !== "boolean" ||
    !numeric(row[1]) ||
    !numeric(row[2])
  )
    return null;
  return {
    kind: "capacity-estimate",
    first: { time: first[1] as number, count: first[2] as number },
    last: { time: last[1] as number, count: last[2] as number },
    budget: last[3] as number,
    returned: { growing: row[0], rate: row[1], hours: row[2] },
  };
}
function reports(artifacts: ExerciseArtifact[]): ReportsResult | null {
  const input = table(artifacts, "Original report and prediction pairs", [
    "Original position",
    "Report",
    "Supplied label",
    "Supplied score",
  ]);
  const output = table(artifacts, "The report queue your code assembled", [
    "Report",
    "Returned label",
    "Returned score",
  ]);
  if (
    !input ||
    !output ||
    input.rows.length !== 3 ||
    output.rows.length !== 3 ||
    input.rows.some(
      (row, i) =>
        row[0] !== i + 1 ||
        !words(row[1]) ||
        !words(row[2]) ||
        !numeric(row[3]),
    ) ||
    output.rows.some(
      (row) => !words(row[0]) || !words(row[1]) || !numeric(row[2]),
    ) ||
    new Set(input.rows.map((row) => row[1])).size !== 3
  )
    return null;
  return {
    kind: "report-pairing",
    supplied: input.rows.map((row) => ({
      position: row[0] as number,
      text: row[1] as string,
      label: row[2] as string,
      score: row[3] as number,
    })),
    returned: output.rows.map((row) => ({
      text: row[0] as string,
      label: row[1] as string,
      score: row[2] as number,
    })),
  };
}
function parity(artifacts: ExerciseArtifact[]): RuntimeParityResult | null {
  const input = table(
    artifacts,
    "Inputs and outputs from your runtime comparison",
    ["Runtime", "Input 1", "Input 2", "Input 3", "Observed output"],
  );
  const output = table(artifacts, "Your runtime comparison", [
    "Outputs agree",
    "TFJS simulated interval",
    "ONNX simulated interval",
  ]);
  if (
    !input ||
    !output ||
    input.rows.length !== 2 ||
    output.rows.length !== 1 ||
    !same(
      input.rows.map((row) => row[0]),
      ["TFJS", "ONNX"],
    ) ||
    input.rows.some((row) => !row.slice(1).every(numeric))
  )
    return null;
  const row = output.rows[0]!;
  if (typeof row[0] !== "boolean" || !numeric(row[1]) || !numeric(row[2]))
    return null;
  return {
    kind: "runtime-parity",
    runs: input.rows.map((row) => ({
      name: row[0] as string,
      inputs: row.slice(1, 4) as number[],
      output: row[4] as number,
    })),
    returned: row[0],
    tfjsMs: row[1],
    onnxMs: row[2],
  };
}
/** Artifacts have already passed the shared bounded validator. */
export function readRuntimeResult(
  slug: string,
  artifacts: ExerciseArtifact[],
): RuntimeResult | null {
  if (slug === "browser-ml-tradeoffs") return policy(artifacts);
  if (slug === "inference-pipeline") return inference(artifacts);
  if (slug === "incident-tensor-leak") return capacity(artifacts);
  if (slug === "load-pretrained-pipeline") return reports(artifacts);
  if (slug === "onnx-comparison") return parity(artifacts);
  return null;
}
export function policyReference(row: PolicyResult["cases"][number]) {
  const local = row.sensitive || row.offline;
  if (row.size > 50)
    return local
      ? {
          decision: "reconsider",
          reason:
            "The model exceeds 50 MB while a local requirement rules out the server.",
        }
      : {
          decision: "server",
          reason: "The model exceeds 50 MB and there is no local requirement.",
        };
  if (local)
    return {
      decision: "client",
      reason:
        "The model fits the inclusive 50 MB budget and a local requirement applies.",
    };
  return row.latency < 50
    ? {
        decision: "client",
        reason: "The model fits and the latency preference is below 50 ms.",
      }
    : {
        decision: "server",
        reason:
          "The model fits, but no local requirement or below-50 ms preference applies.",
      };
}
