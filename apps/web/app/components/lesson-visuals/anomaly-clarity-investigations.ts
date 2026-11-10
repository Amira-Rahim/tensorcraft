import type { LessonInvestigationSpec } from "./investigation-types";
import {
  traceBars as bars,
  traceCells as cells,
  traceChoice as choice,
  traceMean as mean,
  tracePipe as pipe,
  traceRange as range,
  traceRound as round,
} from "./anomaly-time-trace-graphics";

export const SCREENING_ROWS = [
  [1, 2, 3, 4, 5, 6, 7, 8],
  [2, 3, 4, 5, 6, 7, 8, 9],
  [3, 4, 5, 6, 7, 8, 9, 10],
];
export const RECONSTRUCTION_ROWS = [
  [0.5, 0.3, 0.7, 0.2, 0.8, 0.1, 0.6, 0.4],
  [0.9, 0.1, 0.9, 0.1, 0.9, 0.1, 0.9, 0.1],
];
export const CALM_VOTE_WINDOW = [0.5, 0.54, 0.51, 0.53, 0.52, 0.52, 0.5, 0.54];
export function thresholdTrace(
  errors: number[],
  labels: boolean[],
  cutoff: number,
) {
  const predicted = errors.map((value) => value > cutoff);
  let tp = 0,
    fp = 0,
    fn = 0,
    tn = 0;
  predicted.forEach((flag, index) => {
    if (flag && labels[index]) tp++;
    else if (flag) fp++;
    else if (labels[index]) fn++;
    else tn++;
  });
  const precision = tp / (tp + fp) || 0,
    recall = tp / (tp + fn) || 0;
  return {
    predicted,
    tp,
    fp,
    fn,
    tn,
    precision,
    recall,
    f1: (2 * tp) / (2 * tp + fp + fn) || 0,
  };
}
// The intermediate rounding follows the float32 tensor operations in tf.moments.
export function voteWindowStats(window: number[]) {
  const values = window.map(Math.fround);
  const average = Math.fround(mean(values));
  const squares = values.map((value) =>
    Math.fround(Math.fround(value - average) ** 2),
  );
  return { mean: average, std: Math.sqrt(Math.fround(mean(squares))) };
}

export const ANOMALY_CLARITY: Record<string, LessonInvestigationSpec> = {
  "normal-vs-anomalous": {
    title: "A reading against its supplied baseline",
    brief:
      "Follow distance, spread, strict cutoff, and flag for the same reading.",
    boundary:
      "These are the coding exercise's unitless diagnostic values. The separate fictional archive baseline is mean 0.52 and spread 0.15. A flag requests investigation and supplies no ground-truth label.",
    controls: [
      range("value", "Reading", 100, 0, 160),
      range("center", "Baseline mean", 50, 0, 100),
      range("spread", "Baseline standard deviation", 10, 0, 50),
    ],
    cases: [
      {
        id: "standard",
        label: "Distant reading",
        description: "The supplied 100/50/10 diagnostic case.",
      },
      {
        id: "changed",
        label: "Boundary reading",
        description: "Exactly three spreads from the same supplied center.",
        values: { value: 80, center: 50, spread: 10 },
      },
    ],
    prediction: {
      prompt: "Does the strict greater-than-three rule flag this reading?",
      choices: ["flag", "no flag"],
    },
    evaluate: ({ value, center, spread }) => {
      const distance = Math.abs(value! - center!);
      const z = spread === 0 ? null : (value! - center!) / spread!;
      const flag = z === null ? value !== center : Math.abs(z) > 3;
      return {
        graphics: [
          cells(
            "Reading and baseline",
            ["Reading", value!, "Mean", center!, "Standard deviation", spread!],
            2,
          ),
          pipe("Distance into the decision", [
            `Absolute distance ${round(distance)}`,
            z === null
              ? "Zero spread: no z-score"
              : `Signed z ${round(z)}. Absolute z ${round(Math.abs(z))}`,
            z === null
              ? "Use exact equality for this exercise"
              : `Compare ${round(Math.abs(z))} > 3`,
            flag ? "Flag for review" : "No flag under this rule",
          ]),
        ],
        answer: flag ? "flag" : "no flag",
        answerLabel: "Baseline flag",
        explanation:
          z === null
            ? "A constant baseline has no z-score. This exercise flags any unequal reading. A real sensor needs a reviewed measurement tolerance."
            : `Distance ${round(distance)} divided by spread ${spread} gives ${round(Math.abs(z))}. Exactly 3 stays unflagged. The baseline's units and period matter. This does not establish a physical cause or a Gaussian false-alarm probability.`,
        code: `const distance = Math.abs(${value} - ${center});\n// ${spread === 0 ? "Use the exact-reading convention for zero spread." : `distance / ${spread} = ${Math.abs(z!)}`}`,
      };
    },
  },
  autoencoders: {
    title: "The rows that reach reconstruction training",
    brief:
      "Select one eight-feature row, inspect its exclusion flag, and follow the fit input and target.",
    boundary:
      "These are the grader's three-row screening probes. Its real training fixture has 72 synthetic rows and an 8/4/2/4/8 network. The fictional mission model has 11 inputs. This board performs no fit and invents no learned reconstruction.",
    controls: [
      range("row", "Archive row index", 1, 0, 2),
      choice(
        "screen",
        "Training selection",
        ["Keep every row", "Exclude flagged rows"],
        1,
      ),
    ],
    cases: [
      {
        id: "standard",
        label: "First flag arrangement",
        description: "Flags are false,true,false.",
      },
      {
        id: "changed",
        label: "Changed flag arrangement",
        description: "Flags are true,false,false.",
      },
    ],
    prediction: {
      prompt: "Does this selected row reach the fit?",
      choices: ["included", "excluded"],
    },
    evaluate: ({ row, screen }, caseId) => {
      const flags =
        caseId === "changed" ? [true, false, false] : [false, true, false];
      const kept = SCREENING_ROWS.flatMap((_, i) =>
        screen === 0 || !flags[i] ? [i] : [],
      );
      const included = kept.includes(row!);
      return {
        graphics: [
          cells(
            "Selected source row: eight features",
            SCREENING_ROWS[row!]!,
            4,
          ),
          cells(
            "Screening decision",
            [
              `Row ${row}`,
              `Flagged ${flags[row!]}`,
              included ? "Reaches fit" : "Excluded",
              `Kept indices ${kept.join(", ")}`,
            ],
            2,
          ),
          pipe("Fit and architecture", [
            `Input shape [${kept.length}, 8]`,
            "The same selected tensor is both input and target",
            "8 inputs. Dense stages 4, 2, 4, and 8.",
            "400 epochs, batch 16. Caller owns a successful returned model.",
          ]),
        ],
        answer: included ? "included" : "excluded",
        answerLabel: "Row selection",
        explanation: `Row ${row} ${flags[row!] ? "is flagged" : "is unflagged"}. ${screen === 1 ? "The selection excludes flagged rows." : "Keeping every row includes exclusions and violates the screening contract."} Reject mismatched flags and an empty selection before constructing a model. A supplied model remains caller-owned. Actual held-out errors come from the completed fit, without a fixed separation ratio.`,
        code: `const flags = [${flags.join(", ")}];\nconst selected = archive.filter((_, i) => ${screen === 1 ? "!flags[i]" : "true"});\n// Fit the selected tensor against itself.`,
      };
    },
  },
  "reconstruction-error": {
    title: "One feature's share of reconstruction MSE",
    brief:
      "Select a feature and compare the same input with an offset, zero, or identity reconstruction.",
    boundary:
      "These are the exercise's eight-feature diagnostic inputs and fixed model mappings. This board calculates their reference arithmetic. It runs no fitted autoencoder and produces none of the story's 6.2 or twelve-times-normal scores.",
    controls: [
      range("feature", "Feature index", 0, 0, 7),
      choice("mapping", "Diagnostic model", [
        "Input plus 0.1",
        "All zeros",
        "Identity",
      ]),
    ],
    cases: [
      {
        id: "standard",
        label: "First eight-feature input",
        description: "The first supplied input.",
      },
      {
        id: "changed",
        label: "Changed eight-feature input",
        description: "The alternate supplied input has different values.",
      },
    ],
    prediction: {
      prompt: "What is the mean squared reconstruction error for the full row?",
      tolerance: 0.00001,
    },
    evaluate: ({ feature, mapping }, caseId) => {
      const input = RECONSTRUCTION_ROWS[caseId === "changed" ? 1 : 0]!;
      const rebuilt = input.map((value) =>
        mapping === 0 ? value + 0.1 : mapping === 1 ? 0 : value,
      );
      const errors = input.map((value, i) => (value - rebuilt[i]!) ** 2);
      const score = mean(errors);
      const i = feature!;
      return {
        graphics: [
          cells("Input row", input, 4, [i]),
          cells("Reference reconstruction", rebuilt.map(round), 4, [i]),
          pipe("Selected feature into the mean", [
            `Feature ${i}: ${input[i]} minus ${round(rebuilt[i]!)}`,
            `Squared gap ${round(errors[i]!)}`,
            `Feature's share of MSE ${round(errors[i]! / input.length)}`,
            `Sum of 8 squared gaps divided by 8: ${round(score)}`,
          ]),
        ],
        answer: score,
        answerLabel: "Row reconstruction MSE",
        explanation: `The selected squared error is ${round(errors[i]!)}. Average all 8 errors to obtain ${round(score)}. Actual TensorFlow.js values can differ slightly through float32 rounding. A high score describes a reconstruction mismatch. A low score does not prove normality. The separate incident compares absolute gaps with positive absolute-error baselines.`,
        code: "const squared = input.map((value, i) => (value - reconstruction[i]) ** 2);\nconst score = squared.reduce((sum, value) => sum + value, 0) / input.length;",
      };
    },
  },
  "threshold-tuning": {
    title: "A validation cutoff through every labeled case",
    brief:
      "Choose one supplied candidate and inspect a case's flag, confusion cell, and F1 contribution.",
    boundary:
      "The six overlapping diagnostic cases and the all-zero-F1 case come from the grader. These supplied labels belong to these fixtures. They establish no label for 7741 and no future alert rate. F1 selection and crew paging costs are separate decisions.",
    controls: [
      choice("candidate", "Supplied candidate", [
        "First candidate",
        "Second candidate",
      ]),
      {
        ...range("row", "Validation row index", 3, 0, 5),
        maxFor: (values) => (values.rows ?? 6) - 1,
      },
    ],
    cases: [
      {
        id: "standard",
        label: "Overlapping validation scores",
        description: "Scores 0.2,0.4,0.5,0.7,0.9,0.3. Candidates 0.3 and 0.6.",
        values: { rows: 6, row: 3 },
      },
      {
        id: "changed",
        label: "No candidate catches an anomaly",
        description:
          "Scores 0.1,0.2 with labels true,false. Candidates 2 and 3.",
        values: { rows: 2, row: 0 },
      },
    ],
    prediction: {
      prompt: "What F1 does this selected candidate achieve?",
      tolerance: 0.0005,
    },
    evaluate: ({ candidate, row }, caseId) => {
      const errors =
        caseId === "changed" ? [0.1, 0.2] : [0.2, 0.4, 0.5, 0.7, 0.9, 0.3];
      const labels =
        caseId === "changed"
          ? [true, false]
          : [false, true, false, true, true, false];
      const candidates = caseId === "changed" ? [2, 3] : [0.3, 0.6];
      const cutoff = candidates[candidate!]!;
      const result = thresholdTrace(errors, labels, cutoff);
      const i = row!;
      const cell = result.predicted[i]
        ? labels[i]
          ? "TP"
          : "FP"
        : labels[i]
          ? "FN"
          : "TN";
      const scores = candidates.map(
        (t) => thresholdTrace(errors, labels, t).f1,
      );
      return {
        graphics: [
          cells(
            "Supplied scores and strict flags",
            errors.map(
              (value, i) =>
                `${i}: ${value}. label ${labels[i]}. flag ${result.predicted[i]}`,
            ),
            2,
            [i],
          ),
          pipe("Selected case", [
            `Row ${i}: ${errors[i]} > ${cutoff} is ${result.predicted[i]}`,
            `Supplied label ${labels[i]}. Confusion cell ${cell}`,
            `TP${result.tp}, FP${result.fp}, FN${result.fn}, TN${result.tn}`,
          ]),
          bars(
            "Validation metrics",
            [result.precision, result.recall, result.f1],
            ["Precision", "Recall", "F1"],
          ),
          cells(
            "Both supplied candidates",
            candidates.map((value, i) => `${value}: F1 ${round(scores[i]!)}`),
            2,
          ),
        ],
        answer: result.f1,
        answerLabel: "Selected validation F1",
        explanation: `Candidate ${cutoff} gives F1 ${round(result.f1)}. ${scores.every((value) => value === 0) ? "Every score is zero, so any supplied candidate is valid." : "Choose a supplied candidate with the highest F1. Any tied maximizer is valid."} Flags use a strict greater-than comparison. Fix the deployment objective before final testing. The alert-storm editor follows its own ordered runbook.`,
        code: `const predicted = errors.map(error => error > ${cutoff});\n// F1 = 2*TP / (2*TP + FP + FN), or 0 when TP is 0.`,
      };
    },
  },
  "the-anomaly": {
    title: "Three checks, their cutoffs, and a majority",
    brief:
      "Inspect the supplied window's signed z-score beside reconstruction and amplitude-forecast votes.",
    boundary:
      "This follows the exercise's illustrative mission probe. It computes a window statistic and receives the other two detector outputs. It runs no autoencoder or LSTM. Votes establish no event probability, physical cause, or ground-truth label for 7741.",
    controls: [
      range("actual", "Latest normalized amplitude", 0.5, 0, 1, 0.005),
      range("reconstruction", "Supplied reconstruction error", 6.2, 0, 8, 0.1),
      range("forecast", "Supplied amplitude forecast", 0.2, 0, 1, 0.01),
      range("reconCutoff", "Reconstruction cutoff", 1, 0.1, 20, 0.1),
      range("forecastCutoff", "Amplitude-error cutoff", 0.1, 0.01, 0.3, 0.01),
    ],
    cases: [
      {
        id: "standard",
        label: "Eight-reading calm window",
        description: "The supplied mean is near 0.52 with spread near 0.015.",
      },
      {
        id: "changed",
        label: "Shifted window",
        description: "The supplied eight readings alternate 0.25 and 0.35.",
        values: { actual: 0.52, reconstruction: 0.1, forecast: 0.53 },
      },
      {
        id: "constant",
        label: "Constant window",
        description: "Four identical 0.5 readings. The z-score is undefined.",
        values: { actual: 0.5, reconstruction: 2, forecast: 0.5 },
      },
    ],
    prediction: {
      prompt: "How many of the three checks cross their own cutoffs?",
      tolerance: 0,
    },
    evaluate: (
      { actual, reconstruction, forecast, reconCutoff, forecastCutoff },
      caseId,
    ) => {
      const window =
        caseId === "constant"
          ? [0.5, 0.5, 0.5, 0.5]
          : caseId === "changed"
            ? [0.25, 0.35, 0.25, 0.35, 0.25, 0.35, 0.25, 0.35]
            : CALM_VOTE_WINDOW;
      const stats = voteWindowStats(window);
      const constant = window.every((value) => value === window[0]);
      const z = constant ? null : (actual! - stats.mean) / stats.std;
      const miss = Math.abs(forecast! - actual!);
      const flags = [
        z === null ? actual !== window[0] : Math.abs(z) > 3,
        reconstruction! > reconCutoff!,
        miss > forecastCutoff!,
      ];
      const votes = flags.filter(Boolean).length;
      return {
        graphics: [
          cells("Supplied amplitude window", window, 4),
          cells(
            "Computed window baseline",
            [
              `Mean ${round(stats.mean)}`,
              `Population std ${round(stats.std)}`,
              z === null ? "Signed z undefined" : `Signed z ${round(z)}`,
              "Use this window, not the eleven-day baseline",
            ],
            2,
          ),
          pipe("Each check in its own units", [
            z === null
              ? `Constant-window equality: ${flags[0]}`
              : `|${round(z)}| >3: ${flags[0]}`,
            `Reconstruction ${reconstruction} > ${reconCutoff}: ${flags[1]}`,
            `Amplitude miss ${round(miss)} > ${forecastCutoff}: ${flags[2]}`,
            `${votes} votes. ${votes >= 2 ? "Raise alert" : "No alert under majority rule"}`,
          ]),
        ],
        answer: votes,
        answerLabel: "Detector votes",
        explanation: `The statistical score is signed and uses the supplied ${window.length}-reading window. The forecast gate compares absolute amplitude error in 0-to-1 units, separately from the story's three-feature MSE. At least 2 votes raises an alert. A shared capture or training problem can affect several checks.`,
        code: "// Statistical: abs(z) >3, with an explicit constant-window convention.\n// Reconstruction and amplitude forecast each use their supplied cutoff.\nconst alert = votes >= 2;",
      };
    },
  },
};
