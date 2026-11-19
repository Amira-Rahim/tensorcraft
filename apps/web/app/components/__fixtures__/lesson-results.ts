import type { ExerciseArtifact } from "@tensorcraft/ui";

export function sensorArtifacts(slug = "reshape-tensor"): ExerciseArtifact[] {
  return [
    {
      kind: "series",
      title:
        slug === "create-a-tensor"
          ? "Demir’s readings on the chart"
          : "Farah’s chart from your arrangement",
      xLabel: "Selected moment",
      yLabel: "Recorded reading",
      labels: ["1", "2", "3"],
      series: [
        { name: "Sensor A", values: [2, 3, 4] },
        { name: "Sensor B", values: [20, 18, 16] },
        { name: "Sensor C", values: [5, 7, 6] },
        { name: "Sensor D", values: [8, 8, 9] },
      ],
    },
  ];
}

export function gradientArtifacts(): ExerciseArtifact[] {
  return [
    {
      kind: "table",
      title: "Your two gradient methods",
      columns: ["Variable", "Automatic gradient", "Numerical estimate"],
      rows: [
        ["a", 0.32, 0.321],
        ["b", -1, -0.999],
        ["c", 1.5, 1.5],
      ],
    },
    {
      kind: "table",
      title: "Forward calculations needed for those gradients",
      columns: ["Method", "Forward calculations"],
      rows: [
        ["Automatic differentiation", 1],
        ["Numerical estimates", 6],
      ],
    },
  ];
}

/** Predetermined presentation inputs. No learner code runs in this fixture. */
export function denseForwardArtifacts(): ExerciseArtifact[] {
  return [
    {
      kind: "table",
      title: "Your first forward pass",
      columns: ["Reading", "Input 1", "Input 2", "Unit 1", "Unit 2", "Unit 3"],
      rows: [
        [1, 1, 2, 2.6, -0.3, 0.7],
        [2, 3, 4, 5.6, -1.8, 3.7],
      ],
    },
    {
      kind: "table",
      title: "Weights used for this forward pass",
      columns: ["Parameter", "Unit 1", "Unit 2", "Unit 3"],
      rows: [
        ["Input 1", 0.5, -1, 2],
        ["Input 2", 1, 0.25, -0.5],
        ["Bias", 0.1, 0.2, -0.3],
      ],
    },
  ];
}

/** Predetermined presentation inputs, separate from real Worker captures. */
export function lossArtifacts(): ExerciseArtifact[] {
  return [
    {
      kind: "table",
      title: "Inputs and your returned MSE",
      columns: ["Position", "Label", "Prediction", "Returned batch MSE"],
      rows: [
        [1, 3, 2.5, 0.15],
        [2, -0.5, 0, 0.15],
        [3, 2, 2.1, 0.15],
        [4, 1, 1.3, 0.15],
      ],
    },
    {
      kind: "table",
      title: "Farah's loss comparison",
      columns: ["Test case", "Loss"],
      rows: [
        ["Confident and correct", 0.04858735],
        ["Confident and wrong", 3.04858735],
      ],
    },
    {
      kind: "table",
      title: "Logits used for your loss comparison",
      columns: ["Test case", "Position", "Label", "Logit"],
      rows: [
        ["Confident and correct", 1, 1, 3],
        ["Confident and correct", 2, 0, -3],
        ["Confident and wrong", 1, 1, -3],
        ["Confident and wrong", 2, 0, 3],
      ],
    },
  ];
}

export function scalarArtifacts(): ExerciseArtifact[] {
  return [
    {
      kind: "table",
      title: "Your first weight update",
      columns: ["Learning rate", "Stored gradient", "Updated weight"],
      rows: [[0.1, 10, 4]],
    },
    {
      kind: "series",
      title: "The weight after three of your steps",
      xLabel: "Update",
      yLabel: "Weight",
      labels: ["1", "2", "3"],
      series: [{ name: "Weight", values: [4, 3.2, 2.56] }],
    },
    {
      kind: "table",
      title: "Operands from your next two updates",
      columns: [
        "Update",
        "Weight before",
        "Stored gradient",
        "Learning rate",
        "Weight after",
        "Loss after",
      ],
      rows: [
        [2, 4, 8, 0.1, 3.2, 10.24],
        [3, 3.2, 6.4, 0.1, 2.56, 6.5536],
      ],
    },
  ];
}

export function historyArtifacts(epochs = 50): ExerciseArtifact[] {
  const shown = Math.min(64, epochs);
  const labels = Array.from({ length: shown }, (_, i) =>
    String(Math.round((i * (epochs - 1)) / Math.max(1, shown - 1)) + 1),
  );
  const long = epochs >= 20;
  return [
    {
      kind: "series",
      title: "Your training and validation losses",
      xLabel: "Epoch",
      yLabel: "Loss",
      labels,
      series: [
        {
          name: "Training",
          values: labels.map((epoch) =>
            Number(epoch) > epochs - 10 ? 0.8 : 1,
          ),
        },
        {
          name: "Validation",
          values: labels.map((epoch) =>
            Number(epoch) > epochs - 10 ? 1.2 : 1,
          ),
        },
      ],
    },
    {
      kind: "table",
      title: "Your full-history diagnosis",
      columns: ["Measure", "Value"],
      rows: [
        ["Completed epochs", epochs],
        ["Previous window first epoch", long ? epochs - 19 : null],
        ["Previous window last epoch", long ? epochs - 10 : null],
        ["Recent window first epoch", long ? epochs - 9 : null],
        ["Recent window last epoch", long ? epochs : null],
        ["Training previous mean", long ? 1 : null],
        ["Training recent mean", long ? 0.8 : null],
        ["Validation previous mean", long ? 1 : null],
        ["Validation recent mean", long ? 1.2 : null],
        ["Diagnosis status", "returned"],
        [
          "Returned diagnosis",
          long ? "train-down-validation-up" : "insufficient-history",
        ],
        ["Diagnosis detail", ""],
      ],
    },
  ];
}
