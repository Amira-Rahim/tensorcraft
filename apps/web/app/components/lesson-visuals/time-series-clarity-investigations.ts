import type { LessonInvestigationSpec } from "./investigation-types";
import {
  traceBars as bars,
  traceCells as cells,
  traceChoice as choice,
  traceLine as line,
  traceMean as mean,
  tracePipe as pipe,
  traceRange as range,
  traceRound as round,
  traceSoftmax as softmax,
} from "./anomaly-time-trace-graphics";

export function queryValueTrace(
  query: number[],
  keys: number[][],
  values: number[][],
) {
  const products = keys.map((key) =>
    key.map((value, index) => value * query[index]!),
  );
  const scores = products.map((row) =>
    row.reduce((total, value) => total + value, 0),
  );
  const weights = softmax(scores);
  const contributions = values.map((row, t) =>
    row.map((value) => value * weights[t]!),
  );
  const output = values[0]!.map((_, column) =>
    contributions.reduce((total, row) => total + row[column]!, 0),
  );
  return { products, scores, weights, contributions, output };
}
export const POSITIONAL_READINGS = [
  [0, 4],
  [0.25, 2],
  [0.5, 0],
];
export const POSITIONAL_STRONG_READINGS = [
  [2, 4],
  [9, 1],
  [3, 5],
];
export function positionalTrace(rows: number[][], scorer: number[]) {
  const position = rows.map((_, t) =>
    rows.length === 1 ? 0 : t / (rows.length - 1),
  );
  const scores = rows.map(
    (row, t) =>
      row.reduce((total, value, column) => total + value * scorer[column]!, 0) +
      position[t]! * scorer[scorer.length - 1]!,
  );
  const weights = softmax(scores);
  const contributions = rows.map((row, t) =>
    row.map((value) => value * weights[t]!),
  );
  const summary = rows[0]!.map((_, column) =>
    contributions.reduce((total, row) => total + row[column]!, 0),
  );
  return { position, scores, weights, contributions, summary };
}
export function feedbackReference(constant = false) {
  const past = [1, 2],
    arrived = [10, 20, 30],
    rolling = [...past];
  return arrived.map((observation, index) => {
    const rolloutWindow = rolling.slice(-2),
      replayWindow = [...past, ...arrived.slice(0, index)].slice(-2);
    const rollout = constant ? 7 : rolloutWindow.at(-1)! + 1;
    const oneStep = constant ? 7 : replayWindow.at(-1)! + 1;
    rolling.push(rollout);
    return {
      rolloutWindow,
      replayWindow,
      rollout,
      oneStep,
      observation,
      rolloutError: Math.abs(rollout - observation),
      replayError: Math.abs(oneStep - observation),
    };
  });
}
export const PULSE_INTERVAL_LOG = [
  73.1, 72.9, 73.0, 72.6, 72.7, 72.3, 72.4, 72.0,
];
export function kalmanLogTrace(processNoise: number, measurementNoise: number) {
  let estimate = PULSE_INTERVAL_LOG[0]!,
    variance = 1;
  return PULSE_INTERVAL_LOG.map((measurement, index) => {
    const prior = estimate,
      priorVariance = variance;
    if (index === 0)
      return {
        day: 1,
        measurement,
        prior,
        priorVariance,
        predictedVariance: null,
        gain: null,
        correction: null,
        estimate,
        variance,
      };
    const predictedVariance = priorVariance + processNoise;
    const gain = predictedVariance / (predictedVariance + measurementNoise);
    const correction = gain * (measurement - prior);
    estimate = prior + correction;
    variance = (1 - gain) * predictedVariance;
    return {
      day: index + 1,
      measurement,
      prior,
      priorVariance,
      predictedVariance,
      gain,
      correction,
      estimate,
      variance,
    };
  });
}
export type EnsembleMember = {
  name: string;
  predictions: number[];
  heldOutError: number;
};
export const EVALUATION_TARGETS = [10, 20, 30, 40];
export const EVALUATION_MEMBERS: EnsembleMember[] = [
  { name: "LSTM", predictions: [12, 18, 30, 40], heldOutError: 0.045 },
  { name: "Attention", predictions: [8, 22, 30, 40], heldOutError: 0.038 },
  { name: "Kalman", predictions: [10, 20, 33, 37], heldOutError: 0.058 },
];
export function forecastBlendTrace(
  members: EnsembleMember[],
  actual: number[],
) {
  const smallest = Math.min(...members.map((member) => member.heldOutError));
  const scaled = members.map((member) => (smallest / member.heldOutError) ** 2);
  const total = scaled.reduce((sum, value) => sum + value, 0),
    weights = scaled.map((value) => value / total);
  const equal = actual.map((_, column) =>
    mean(members.map((member) => member.predictions[column]!)),
  );
  const weighted = actual.map((_, column) =>
    members.reduce(
      (sum, member, index) =>
        sum + member.predictions[column]! * weights[index]!,
      0,
    ),
  );
  const mae = (values: number[]) =>
    mean(values.map((value, index) => Math.abs(value - actual[index]!)));
  const perMember = members.map((member) => mae(member.predictions));
  return {
    scaled,
    weights,
    equal,
    weighted,
    perMember,
    equalMae: mae(equal),
    weightedMae: mae(weighted),
    beatsBest: mae(equal) < Math.min(...perMember),
  };
}

export const TIME_SERIES_CLARITY: Record<string, LessonInvestigationSpec> = {
  "beyond-lstm": {
    title: "A query scores keys and blends separate values",
    brief:
      "Select a key row and output component. Follow dot-product terms, softmax, and weighted values.",
    boundary:
      "These are the exercise's fixed arithmetic probes. The board performs no training and establishes no forecast quality or causal explanation. Scores are unscaled. Moving matched key/value rows keeps the blend for a fixed query.",
    controls: [
      range("query", "First query coordinate", 1, -3, 3, 0.25),
      range("step", "Selected key/value row", 0, 0, 1),
      range("component", "Output component", 0, 0, 1),
      choice("reverse", "Matched row order", ["Original", "Reversed"]),
    ],
    cases: [
      {
        id: "standard",
        label: "Two-coordinate query",
        description:
          "Query [1,0], identity keys, and values twice the identity.",
      },
      {
        id: "changed",
        label: "Different key and value widths",
        description:
          "Query [1,2,-1] has three coordinates. Value rows still have two.",
      },
    ],
    prediction: {
      prompt: "What value appears in the selected output component?",
      tolerance: 0.0001,
    },
    evaluate: ({ query, step, component, reverse }, caseId) => {
      const q = caseId === "changed" ? [query!, 2, -1] : [query!, 0];
      let keys =
        caseId === "changed"
          ? [
              [1, 0, 1],
              [0, 1, 0],
            ]
          : [
              [1, 0],
              [0, 1],
            ];
      let values = [
        [2, 0],
        [0, 2],
      ];
      if (reverse) {
        keys = [...keys].reverse();
        values = [...values].reverse();
      }
      const result = queryValueTrace(q, keys, values),
        t = step!,
        column = component!;
      return {
        graphics: [
          cells(
            "Query and selected key products",
            result.products[t]!.map(
              (value, index) => `${q[index]} × ${keys[t]![index]} = ${value}`,
            ),
            2,
          ),
          bars("Unscaled score per time step", result.scores, [
            "Row 0",
            "Row 1",
          ]),
          bars(
            "Softmax share across time",
            result.weights,
            ["Row 0", "Row 1"],
            "attention-share",
          ),
          cells(
            "Selected value coordinate and contribution",
            values.map(
              (row, index) =>
                `Row ${index}: ${row[column]} × ${round(result.weights[index]!)} = ${round(result.contributions[index]![column]!)}`,
            ),
            2,
          ),
          pipe("Value blend", [
            `Sum contributions for component ${column}`,
            `Output ${round(result.output[column]!)}`,
            `Key width ${q.length}. Value width ${values[0]!.length}`,
          ]),
        ],
        answer: result.output[column]!,
        answerLabel: "Blended value component",
        explanation: `The selected row's score is ${round(result.scores[t]!)} and its weight is ${round(result.weights[t]!)}. Softmax runs across time. Values supply the blended coordinates. The exercise's query is [d] and result is [dv], even when dv is 1. The batched example keeps an extra batch axis until it explicitly removes axis 0.`,
        code: "// scores = query row × keys transposed\n// weights = softmax(scores across time)\n// output = weights × values, then remove only axis 0",
      };
    },
  },
  "temporal-attention": {
    title: "Position affects scores, not summary width",
    brief:
      "Follow one reading through its position, score, weight, and original-feature contribution.",
    boundary:
      "These are the grader's moderate-score and position-only fixtures. We choose the scorer coefficients. This performs no training. Truncating the shown rows renormalizes their weights and positions, but cannot recover missing observations.",
    controls: [
      range("length", "Available readings", 3, 1, 3),
      {
        ...range("step", "Selected time step", 2, 0, 2),
        maxFor: (values) => values.length! - 1,
      },
      range("feature", "Summary feature", 0, 0, 1),
      range("featureWeight", "First-feature coefficient", 1, -2, 2, 0.25),
      range("positionWeight", "Position coefficient", 0.5, -2, 20, 0.5),
    ],
    cases: [
      {
        id: "standard",
        label: "Moderate scorer",
        description: "The first feature and position produce scores 0,0.5,1.",
        values: { featureWeight: 1, positionWeight: 0.5 },
      },
      {
        id: "changed",
        label: "Position-only scorer",
        description: "Only position contributes to the score.",
        values: { featureWeight: 0, positionWeight: 20 },
      },
    ],
    prediction: {
      prompt: "What is the selected pooled feature value?",
      tolerance: 0.0001,
    },
    evaluate: (
      { length, step, feature, featureWeight, positionWeight },
      caseId,
    ) => {
      const rows = (
          caseId === "changed"
            ? POSITIONAL_STRONG_READINGS
            : POSITIONAL_READINGS
        ).slice(0, length),
        result = positionalTrace(rows, [featureWeight!, 0, positionWeight!]),
        t = step!,
        column = feature!;
      return {
        graphics: [
          cells(
            "Original readings: two features",
            rows.flatMap((row) => row),
            2,
            [t * 2, t * 2 + 1],
          ),
          cells(
            "Selected reading into its score",
            [
              `Position ${round(result.position[t]!)}`,
              `Feature term ${round(rows[t]![0]! * featureWeight!)}`,
              `Position term ${round(result.position[t]! * positionWeight!)}`,
              `Score ${round(result.scores[t]!)}`,
            ],
            2,
          ),
          bars(
            "Normalized weight across available time steps",
            result.weights,
            rows.map((_, i) => String(i)),
            "attention-share",
          ),
          cells(
            "Weighted original-feature contributions",
            result.contributions.map(
              (row, i) => `${i}: ${round(row[column]!)}`,
            ),
            2,
          ),
          pipe("Pool without the position column", [
            `Summary feature ${column}: ${round(result.summary[column]!)}`,
            `Returned shape [${rows[0]!.length}]`,
            `${length} weights sum to 1. This does not establish capture completeness.`,
          ]),
        ],
        answer: result.summary[column]!,
        answerLabel: "Pooled original feature",
        explanation: `Time step ${t} has position ${round(result.position[t]!)} and weight ${round(result.weights[t]!)}. Multiply that weight by its original feature value, then sum contributions over time. Position changes scores but never becomes a summary feature. A one-step window uses position 0. Keep a one-feature summary as [1], not a scalar.`,
        code: "const position = T === 1 ? 0 : t / (T - 1);\n// Score [original features, position]. Pool original features only.",
      };
    },
  },
  forecasting: {
    title: "Which history enters the next prediction?",
    brief:
      "Select a horizon and compare rollout history with the observations available to replay.",
    boundary:
      "This uses the exercise's controlled supplied-model probes: last value plus 1, or a constant 7. No model is trained here. The learner's separate actual LSTM fit produces its own captured curves, with no guaranteed ranking or growth of error.",
    controls: [range("horizon", "Selected horizon", 1, 1, 3)],
    cases: [
      {
        id: "standard",
        label: "History-sensitive probe",
        description:
          "Past [1,2], arrived [10,20,30], supplied model returns latest input plus 1.",
      },
      {
        id: "changed",
        label: "Constant probe",
        description:
          "The same inputs and observations, with a supplied model returning 7.",
      },
    ],
    prediction: {
      prompt: "What does rollout predict at the selected horizon?",
      tolerance: 0,
    },
    evaluate: ({ horizon }, caseId) => {
      const trace = feedbackReference(caseId === "changed"),
        selected = trace[horizon! - 1]!;
      return {
        graphics: [
          line(
            "Arrived observations",
            trace.map((row) => row.observation),
            ["1", "2", "3"],
            [horizon! - 1],
            "feedback-scalar",
          ),
          cells(
            "Windows before the selected prediction",
            [
              `Rollout [${selected.rolloutWindow.join(", ")}]`,
              `Replay [${selected.replayWindow.join(", ")}]`,
            ],
            2,
          ),
          line(
            "Rollout predictions",
            trace.map((row) => row.rollout),
            ["1", "2", "3"],
            [horizon! - 1],
            "feedback-scalar",
          ),
          line(
            "One-step replay predictions",
            trace.map((row) => row.oneStep),
            ["1", "2", "3"],
            [horizon! - 1],
            "feedback-scalar",
          ),
          cells(
            "Selected horizon after the observation arrives",
            [
              `Rollout ${selected.rollout}`,
              `Replay ${selected.oneStep}`,
              `Observed ${selected.observation}`,
              `Absolute errors ${selected.rolloutError} and ${selected.replayError}`,
            ],
            2,
          ),
        ],
        answer: selected.rollout,
        answerLabel: "Rollout prediction",
        explanation: `At horizon ${horizon}, rollout reads its prior predictions while replay reads only earlier arrived observations. Neither sees the current target before predicting. The controlled model produces rollout ${selected.rollout} and replay ${selected.oneStep}. The real trained model may produce equal paths or poor forecasts. Read its actual horizon errors without assuming replay must win.`,
        code: `// The selected [1, 2, 1] input windows are:\n// rollout: [${selected.rolloutWindow.join(", ")}]\n// replay: [${selected.replayWindow.join(", ")}]`,
      };
    },
  },
  "kalman-filters": {
    title: "One day in the changing pulse interval log",
    brief:
      "Select a day. Follow its prior variance, predicted variance, gain, correction, and carried state.",
    boundary:
      "This is the existing eight-day fictional first-cycle log. Intervals use seconds. Noise parameters and uncertainty are variances in squared seconds. Day 1 initializes the estimate and receives no fabricated correction. Smoothness establishes no accuracy gain.",
    controls: [
      range("day", "Day in the interval log", 8, 1, 8),
      range("process", "Process variance Q", 0.1, 0, 1, 0.1),
      range("measurement", "Measurement variance R", 1, 0.1, 4, 0.1),
    ],
    cases: [
      {
        id: "standard",
        label: "Lesson uncertainty assumptions",
        description:
          "Initial variance 1, process variance 0.1, measurement variance 1.",
      },
      {
        id: "changed",
        label: "Changed uncertainty assumptions",
        description: "The same recorded intervals with Q=0.5 and R=0.5.",
        values: { process: 0.5, measurement: 0.5 },
      },
    ],
    prediction: {
      prompt: "What estimate is stored after the selected day?",
      tolerance: 0.0001,
    },
    evaluate: ({ day, process, measurement }) => {
      const trace = kalmanLogTrace(process!, measurement!),
        row = trace[day! - 1]!,
        labels = trace.map((value) => String(value.day));
      const ema = (alpha: number) => {
        let value = PULSE_INTERVAL_LOG[0]!;
        return PULSE_INTERVAL_LOG.map((measurement, index) => {
          if (index) value = alpha * measurement + (1 - alpha) * value;
          return value;
        });
      };
      return {
        graphics: [
          line(
            "Recorded daily pulse intervals",
            PULSE_INTERVAL_LOG,
            labels,
            [day! - 1],
            "pulse-interval-seconds",
          ),
          cells(
            "Prior and updated state",
            [
              `Prior estimate ${round(row.prior)} s`,
              `Prior variance ${round(row.priorVariance)} s²`,
              `Stored estimate ${round(row.estimate)} s`,
              `Stored variance ${round(row.variance)} s²`,
            ],
            2,
          ),
          line(
            "Filtered interval estimate",
            trace.map((value) => value.estimate),
            labels,
            [day! - 1],
            "pulse-interval-seconds",
          ),
          pipe(
            "Selected day's correction",
            row.gain === null
              ? [
                  "Day 1 initializes from 73.1 seconds",
                  "Chosen initial variance: 1 s²",
                  "No correction or gain is claimed",
                ]
              : [
                  `Predicted variance ${round(row.priorVariance)} + ${process} = ${round(row.predictedVariance!)} s²`,
                  `Gain ${round(row.predictedVariance!)} / (${round(row.predictedVariance!)} + ${measurement}) = ${round(row.gain)}`,
                  `Correction ${round(row.gain)} × (${row.measurement} - ${round(row.prior)}) = ${round(row.correction!)} s`,
                  `Next variance (1 - gain) × predicted variance = ${round(row.variance)} s²`,
                ],
          ),
          line(
            "EMA baseline alpha 0.2",
            ema(0.2),
            labels,
            [day! - 1],
            "pulse-interval-seconds",
          ),
          line(
            "EMA baseline alpha 0.8",
            ema(0.8),
            labels,
            [day! - 1],
            "pulse-interval-seconds",
          ),
        ],
        answer: row.estimate,
        answerLabel: "Stored interval estimate in seconds",
        explanation: `Day ${day} records ${row.measurement} seconds. The filter stores ${round(row.estimate)} seconds and variance ${round(row.variance)} s². The next update uses this carried variance. The one-state prediction has no downward velocity term, so it can lag the decline. The EMA curves are baselines on the same log, not true values.`,
        code: "const predictedVariance = priorVariance + processVariance;\nconst gain = predictedVariance / (predictedVariance + measurementVariance);\n// Carry both corrected estimate and corrected variance into tomorrow.",
      };
    },
  },
  "time-series-ensemble-methods": {
    title: "A target position through every member and both blends",
    brief:
      "Inspect aligned member predictions, earlier-period weights, and current-period errors.",
    boundary:
      "These are the exercise's four synthetic targets and supplied predictions. Their target units are arbitrary. Prior-period errors are separate range-normalized MAEs. This is arithmetic over provided forecasts and reproduces none of the story's 0.036 result.",
    controls: [
      range("position", "Target position", 0, 0, 3),
      choice(
        "blend",
        "Selected blend",
        ["Equal shares", "Prior-error weights"],
        1,
      ),
    ],
    cases: [
      {
        id: "standard",
        label: "Different member errors",
        description:
          "The three supplied members miss in partly opposing directions.",
      },
      {
        id: "changed",
        label: "Shared member errors",
        description:
          "The supplied correlated-error fixture has identical member predictions.",
      },
    ],
    prediction: {
      prompt:
        "What is this selected blend's absolute error at the selected target?",
      tolerance: 0.0001,
    },
    evaluate: ({ position, blend }, caseId) => {
      const actual =
        caseId === "changed" ? [36, 38, 37, 39] : EVALUATION_TARGETS;
      const members =
        caseId === "changed"
          ? [
              {
                name: "LSTM",
                predictions: [37, 39, 38, 40],
                heldOutError: 0.04,
              },
              {
                name: "Attention",
                predictions: [37, 39, 38, 40],
                heldOutError: 0.05,
              },
              {
                name: "Kalman",
                predictions: [37, 39, 38, 40],
                heldOutError: 0.06,
              },
            ]
          : EVALUATION_MEMBERS;
      const trace = forecastBlendTrace(members, actual),
        i = position!;
      const selected = blend === 0 ? trace.equal[i]! : trace.weighted[i]!;
      return {
        graphics: [
          cells(
            "Aligned predictions and current target",
            [
              ...members.map(
                (member) => `${member.name}: ${member.predictions[i]}`,
              ),
              `Observed target ${actual[i]}`,
            ],
            2,
          ),
          cells(
            "Earlier-period errors into stable weights",
            members.map(
              (member, index) =>
                `${member.name}: prior MAE ${member.heldOutError}. Scaled inverse-square ${round(trace.scaled[index]!)}. Weight ${round(trace.weights[index]!)}`,
            ),
            1,
          ),
          bars(
            "Current-window mean absolute errors",
            [...trace.perMember, trace.equalMae, trace.weightedMae],
            [
              ...members.map((member) => member.name),
              "Equal blend",
              "Prior-weighted blend",
            ],
          ),
          pipe("Selected target and full-window comparison", [
            `Equal prediction ${round(trace.equal[i]!)}. Error ${round(Math.abs(trace.equal[i]! - actual[i]!))}`,
            `Weighted prediction ${round(trace.weighted[i]!)}. Error ${round(Math.abs(trace.weighted[i]! - actual[i]!))}`,
            `Equal-blend beatsBest: ${trace.beatsBest}`,
            "beatsBest compares equal-blend MAE with every member on all four targets.",
          ]),
        ],
        answer: Math.abs(selected - actual[i]!),
        answerLabel: "Selected target absolute error",
        explanation: `Position ${i} has target ${actual[i]}. The selected blend predicts ${round(selected)}. Its absolute error is ${round(Math.abs(selected - actual[i]!))}. Weights use (smallest prior error / member prior error)² before normalization, which stays finite for tiny positive errors. The equal blend ${trace.beatsBest ? "beats" : "does not beat"} the best current member. A tie is not a win. Earlier-period weights guarantee no current or future gain.`,
        code: "// Earlier-period positive errors set the weights.\nconst scaled = errors.map(error => (Math.min(...errors) / error) ** 2);\n// Score each blend and every member on the same current targets.",
      };
    },
  },
};
