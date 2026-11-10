import type { ExerciseArtifact } from "@tensorcraft/ui";

/** Predetermined presentation probes. These functions execute no learner code. */
export function policyArtifacts(): ExerciseArtifact[] {
  const columns = [
    "Model MB",
    "Latency preference ms",
    "Sensitive input",
    "Offline required",
    "Returned recommendation",
  ];
  return [
    {
      kind: "table",
      title: "Local requirements in your policy probe",
      columns,
      rows: [
        [51, 500, true, false, "reconsider"],
        [51, 500, false, true, "reconsider"],
        [51, 500, true, true, "reconsider"],
      ],
    },
    {
      kind: "table",
      title: "Boundary inputs in your policy probe",
      columns,
      rows: [
        [50, 49, false, false, "client"],
        [50, 50, false, false, "server"],
      ],
    },
    {
      kind: "table",
      title: "Your deployment recommendations",
      columns: ["Model MB", "Latency preference ms", "Recommendation"],
      rows: [
        [50, 49, "client"],
        [50, 50, "server"],
      ],
    },
  ];
}
export function inferenceArtifacts(): ExerciseArtifact[] {
  return [
    {
      kind: "table",
      title: "Raw fields and input values from your handler",
      columns: [
        "Feature key",
        "Raw input",
        "Reference min",
        "Reference max",
        "Observed scaled input",
      ],
      rows: [
        ["amplitude", 512, 0, 2048, 0.25],
        ["frequency", 21, 0, 63, Math.fround(1 / 3)],
        ["phase", Math.PI / 2, -Math.PI, Math.PI, 0.75],
      ],
    },
    {
      kind: "table",
      title: "The probe output and your returned decision",
      columns: [
        "Observed model output",
        "Returned class",
        "Selected class score",
      ],
      rows: [[0.25, "noise", 0.75]],
    },
    {
      kind: "table",
      title: "What your handler sent to the model",
      columns: [
        "Amplitude scaled",
        "Zero-crossing count scaled",
        "Phase scaled",
        "Returned class",
        "Selected class score",
      ],
      rows: [[0.25, Math.fround(1 / 3), 0.75, "noise", 0.75]],
    },
    {
      kind: "table",
      title: "Tensor count around your prediction",
      columns: ["Before call", "After call"],
      rows: [[4, 4]],
    },
  ];
}
export function capacityArtifacts(): ExerciseArtifact[] {
  return [
    {
      kind: "table",
      title: "Endpoints supplied for your capacity estimate",
      columns: ["Endpoint", "Hours", "Tensor count", "Budget tensors"],
      rows: [
        ["First", 0, 400, 10000],
        ["Last", 1, 520, 10000],
      ],
    },
    {
      kind: "table",
      title: "Your capacity estimate for the watch",
      columns: ["Growing", "Tensors per hour", "Hours to budget"],
      rows: [[true, 120, 79]],
    },
  ];
}
export function reportArtifacts(): ExerciseArtifact[] {
  return [
    {
      kind: "table",
      title: "Original report and prediction pairs",
      columns: [
        "Original position",
        "Report",
        "Supplied label",
        "Supplied score",
      ],
      rows: [
        [1, "coupling nominal", "POS", 0.5],
        [2, "coolant loop warning", "NEG", 0.99],
        [3, "watch handover clean", "POS", 0.7],
      ],
    },
    {
      kind: "table",
      title: "The report queue your code assembled",
      columns: ["Report", "Returned label", "Returned score"],
      rows: [
        ["coolant loop warning", "NEG", 0.99],
        ["watch handover clean", "POS", 0.7],
        ["coupling nominal", "POS", 0.5],
      ],
    },
  ];
}
export function parityArtifacts(): ExerciseArtifact[] {
  const input = [0.42, 0.66, 0.31].map(Math.fround),
    output = Math.fround(1 / (1 + Math.exp(-(0.42 + 2 * 0.66 + 3 * 0.31))));
  return [
    {
      kind: "table",
      title: "Inputs and outputs from your runtime comparison",
      columns: ["Runtime", "Input 1", "Input 2", "Input 3", "Observed output"],
      rows: [
        ["TFJS", ...input, output],
        ["ONNX", ...input, output],
      ],
    },
    {
      kind: "table",
      title: "Your runtime comparison",
      columns: [
        "Outputs agree",
        "TFJS simulated interval",
        "ONNX simulated interval",
      ],
      rows: [[true, 17, 17]],
    },
  ];
}
