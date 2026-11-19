import type {
  InvestigationControl,
  InvestigationGraphic,
  LessonInvestigationSpec,
} from "./investigation-types";
const round = (value: number) => Math.round(value * 1000) / 1000;
const range = (
  id: string,
  label: string,
  initial: number,
  min: number,
  max: number,
  step = 1,
): InvestigationControl => ({
  id,
  label,
  initial,
  min,
  max,
  step,
  kind: "range",
});
const choice = (
  id: string,
  label: string,
  labels: string[],
  initial = 0,
  values = labels.map((_, i) => i),
): InvestigationControl => ({
  id,
  label,
  initial: values[initial] ?? initial,
  kind: "choice",
  options: labels.map((label, i) => ({ label, value: values[i]! })),
});
const cells = (
  label: string,
  values: Array<number | string>,
  labels?: string[],
  highlight?: number[],
  columns = 2,
): InvestigationGraphic => ({
  kind: "cells",
  label,
  values,
  labels,
  highlight,
  columns,
});
const pipe = (label: string, values: string[]): InvestigationGraphic => ({
  kind: "pipeline",
  label,
  values,
});
const line = (
  label: string,
  values: number[],
  scaleGroup: string,
  highlight: number[] = [],
  labels = values.map((_, i) => String(i)),
): InvestigationGraphic => ({
  kind: "line",
  label,
  values: values.map(round),
  labels,
  highlight,
  scaleGroup,
});
export const WINDOW_TASK_CASES = {
  standard: {
    label: "Five one-feature rows",
    rows: [[1], [2], [3], [4], [5]],
    window: 3,
    stride: 1,
  },
  changed: {
    label: "Three two-feature rows",
    rows: [
      [1, 10],
      [2, 20],
      [3, 30],
    ],
    window: 2,
    stride: 1,
  },
  stride: {
    label: "Seven rows with stride two",
    rows: [[1], [2], [3], [4], [5], [6], [7]],
    window: 2,
    stride: 2,
  },
  empty: {
    label: "No following target",
    rows: [[1], [2], [3]],
    window: 3,
    stride: 1,
  },
};
export function nextReadingPairs(
  rows: number[][],
  window: number,
  stride: number,
) {
  const xs: number[][][] = [],
    ys: number[][] = [],
    starts: number[] = [];
  for (let start = 0; start + window < rows.length; start += stride) {
    starts.push(start);
    xs.push(rows.slice(start, start + window));
    ys.push(rows[start + window]!);
  }
  return { xs, ys, starts };
}
export const RNN_TASK_CASES = {
  standard: {
    label: "Repeated input, different history",
    readings: [0.5, 0.9, 0.5],
    memory: 0.8,
    step: 2,
  },
  changed: {
    label: "Growing derivative check",
    readings: Array(60).fill(0.001) as number[],
    memory: 1.5,
    step: 13,
  },
  decay: {
    label: "Shrinking derivative check",
    readings: Array(60).fill(0.001) as number[],
    memory: 0.8,
    step: 59,
  },
};
export function recurrentTrace(
  readings: number[],
  memory: number,
  inputWeight: number,
  bias: number,
) {
  let previous = 0,
    product = 1;
  return readings.map((reading) => {
    const old = previous,
      inputTerm = reading * inputWeight,
      stateTerm = memory * old,
      sum = inputTerm + stateTerm + bias;
    previous = Math.tanh(sum);
    const local = memory * (1 - previous * previous);
    product *= local;
    return {
      old,
      reading,
      inputTerm,
      stateTerm,
      sum,
      state: previous,
      local,
      product,
    };
  });
}
export const CLASSIFICATION_ROWS = Array.from({ length: 12 }, (_, i) => [i]);
export const CLASSIFICATION_LABELS = CLASSIFICATION_ROWS.map(([i]) =>
  Number(i! >= 4 && i! < 9),
);
export function classificationWindows(window: number, splitAt: number) {
  const train = { xs: [] as number[][][], ys: [] as number[] },
    evaluation = { xs: [] as number[][][], ys: [] as number[] },
    dropped: number[] = [];
  for (let start = 0; start + window <= 12; start++) {
    const end = start + window,
      rows = CLASSIFICATION_ROWS.slice(start, end),
      label = CLASSIFICATION_LABELS[end - 1]!;
    if (end <= splitAt) {
      train.xs.push(rows);
      train.ys.push(label);
    } else if (start >= splitAt) {
      evaluation.xs.push(rows);
      evaluation.ys.push(label);
    } else dropped.push(start);
  }
  return { train, eval: evaluation, dropped };
}
export const FORECAST_SEED = [
  [0.2, 0.4, 0.1],
  [0.6, 0.8, -0.2],
  [1, 1.2, 0],
  [0.4, 0.6, 0.3],
  [0.8, 1, 0.25],
];
export const FORECAST_LIMITS = [
  { min: 0, max: 2048 },
  { min: 0, max: 63 },
  { min: -Math.PI, max: Math.PI },
];
export const FORECAST_SCALERS = {
  standard: { mean: [1024, 32, 0], std: [512, 16, 1] },
  changed: { mean: [900, 28, 0], std: [300, 12, 1.2] },
};
export function controlledForecast(
  scaler: typeof FORECAST_SCALERS.standard,
  window: number,
  steps: number,
) {
  const bounds = FORECAST_LIMITS.map((limit, j) => ({
    min: (limit.min - scaler.mean[j]!) / scaler.std[j]!,
    max: (limit.max - scaler.mean[j]!) / scaler.std[j]!,
  }));
  const history = FORECAST_SEED.map((row) => row.slice());
  const rows: number[][] = [];
  const trace = [];
  for (let step = 0; step < steps; step++) {
    const input = history.slice(-window).map((row) => row.slice()),
      last = input.at(-1)!;
    const raw = [last[2]! * 4 + 0.7, last[0]! * 1.6 - 2.4, last[1]! * 0.6];
    const bounded = raw.map((value, j) =>
      Math.min(Math.max(value, bounds[j]!.min), bounds[j]!.max),
    );
    rows.push(bounded);
    history.push(bounded);
    trace.push({
      input,
      raw,
      bounded,
      next: history.slice(-window).map((row) => row.slice()),
    });
  }
  return { bounds, rows, trace };
}
export const RECURRENT_TASK_INVESTIGATIONS: Record<
  string,
  LessonInvestigationSpec
> = {
  "sequences-matter": {
    title: "A window and the reading that follows it",
    brief:
      "Trace original row positions into the input windows, next-reading targets, and tensor axes. This prepares pairs without training a model.",
    boundary:
      "These are the exercise's supplied small diagnostic streams. Row numbers identify positions, not timestamps or archive IDs. The five-row case has one feature. The changed case has two. Reversing is an explicit order comparison, separate from chronological forecasting.",
    controls: [
      {
        ...range("window", "Input readings per window", 3, 1, 7),
        maxFor: (v) => v.length!,
      },
      range("stride", "Stride in readings", 1, 1, 4),
      {
        ...range("selected", "Window index to inspect", 0, 0, 6),
        maxFor: (v) =>
          Math.max(0, Math.ceil((v.length! - v.window!) / v.stride!) - 1),
      },
      choice("reverse", "Input row order", [
        "Supplied order",
        "Reversed comparison",
      ]),
    ],
    cases: Object.entries(WINDOW_TASK_CASES).map(([id, item]) => ({
      id,
      label: item.label,
      description: `${item.rows.length} supplied rows with ${item.rows[0]!.length} feature(s). Keep a pair only when another row follows the window.`,
      values: {
        length: item.rows.length,
        window: item.window,
        stride: item.stride,
        selected: 0,
      },
    })),
    prediction: {
      prompt:
        "Which original row index supplies the selected target? Use -1 when no pair exists.",
      tolerance: 0,
    },
    evaluate: ({ window, stride, selected, reverse }, caseId) => {
      const item = WINDOW_TASK_CASES[caseId as keyof typeof WINDOW_TASK_CASES];
      const order = item.rows.map((_, i) => i);
      if (reverse) order.reverse();
      const source = order.map((i) => item.rows[i]!);
      const pairs = nextReadingPairs(source, window, stride),
        count = pairs.xs.length;
      const start = pairs.starts[selected],
        targetPosition = start === undefined ? -1 : start + window,
        targetIndex = targetPosition < 0 ? -1 : order[targetPosition]!;
      const graphics: InvestigationGraphic[] = [
        cells(
          "Original row positions and supplied feature values",
          order.flatMap((i) => [`Row ${i}`, JSON.stringify(item.rows[i])]),
          undefined,
          undefined,
          2,
        ),
        pipe("Pair construction and axes", [
          `${window} readings per input, stride ${stride}`,
          `${count} retained pairs`,
          count
            ? `xsTensor: [${count}, ${window}, ${item.rows[0]!.length}]`
            : "xsTensor: null",
          count
            ? `ysTensor: [${count}, ${item.rows[0]!.length}]`
            : "ysTensor: null",
        ]),
      ];
      if (count)
        graphics.push(
          cells(
            "Selected input window in time and feature order",
            pairs.xs[selected]!.flat(),
            pairs.xs[selected]!.flatMap((row, t) =>
              row.map(
                (_, f) => `Original row ${order[start! + t]}, feature ${f}`,
              ),
            ),
          ),
          cells(
            "Immediately following target row",
            pairs.ys[selected]!,
            pairs.ys[selected]!.map(
              (_, f) => `Original row ${targetIndex}, feature ${f}`,
            ),
          ),
          pipe("Input and target membership", [
            `Input positions ${order.slice(start, start! + window).join(", ")}`,
            `Target position ${targetIndex}, outside that input`,
            `The final possible input-only window has no following target and is omitted`,
          ]),
        );
      else
        graphics.push(
          pipe("No supervised pairs", [
            "No reading follows a complete input window",
            "Return xs: [], ys: []",
            "Return null for both tensors",
          ]),
        );
      return {
        graphics,
        answer: targetIndex,
        answerLabel: "Original target-row index",
        explanation: count
          ? `Window ${selected} begins at current position ${start}, keeps ${window} rows, and takes its target from the following position ${targetPosition} (original row ${targetIndex}). Advancing by stride ${stride} controls the next start. The target stays outside its own input. Building these pairs makes no prediction and trains no model.`
          : "A full window without a following row has no target. The arrays are empty and both tensors are null. A tensor shape cannot infer a missing target.",
        code: `const selectedInput = ${JSON.stringify(count ? pairs.xs[selected] : [])};\nconst selectedTarget = ${JSON.stringify(count ? pairs.ys[selected] : null)};\nconst targetSourceIndex = ${targetIndex};\nconst xsShape = ${count ? JSON.stringify([count, window, item.rows[0]!.length]) : "null"};`,
      };
    },
  },
  "simple-rnns": {
    title: "Each recurrent contribution and its derivative",
    brief:
      "Scrub a supplied scalar recurrence. Link the input term, previous-state term, bias, tanh result, and running derivative product.",
    boundary:
      "The initial drill uses the exercise's readings [0.5,0.9,0.5], recurrent weight 0.8, input weight 1, and bias 0. The longer checks repeat 0.001 for 60 steps. These optimization probes are separate from the fictional overnight network. No extra division by ten or training happens here.",
    controls: [
      {
        ...range("step", "Time step index", 2, 0, 59),
        maxFor: (v) => v.length! - 1,
      },
      range("memory", "Recurrent weight", 0.8, -1.5, 1.5, 0.1),
      range("inputWeight", "Input weight", 1, 0, 2, 0.1),
      range("bias", "Bias", 0, -0.5, 0.5, 0.05),
      choice("quantity", "Prediction quantity", [
        "Hidden state",
        "Running state derivative",
      ]),
    ],
    cases: Object.entries(RNN_TASK_CASES).map(([id, item]) => ({
      id,
      label: item.label,
      description: `${item.readings.length} supplied readings. Every run begins at hidden state zero.`,
      values: {
        length: item.readings.length,
        memory: item.memory,
        step: item.step,
        inputWeight: 1,
        bias: 0,
      },
    })),
    prediction: {
      prompt: "What value does the selected quantity have after this step?",
      tolerance: 0.005,
    },
    evaluate: ({ step, memory, inputWeight, bias, quantity }, caseId) => {
      const item = RNN_TASK_CASES[caseId as keyof typeof RNN_TASK_CASES],
        trace = recurrentTrace(item.readings, memory, inputWeight, bias),
        row = trace[step]!;
      return {
        graphics: [
          line("Supplied readings in order", item.readings, "rnn-task-input", [
            step,
          ]),
          cells(
            "Selected recurrent update",
            [
              row.reading,
              inputWeight,
              round(row.inputTerm),
              round(row.old),
              memory,
              round(row.stateTerm),
              bias,
              round(row.sum),
              round(row.state),
            ],
            [
              "Current input",
              "Input weight",
              "Input contribution",
              "Previous hidden state",
              "Recurrent weight",
              "Previous-state contribution",
              "Bias",
              "Pre-activation sum",
              "New hidden state",
            ],
          ),
          line(
            "Hidden state after each reading",
            trace.map((row) => row.state),
            "rnn-task-hidden",
            [step],
          ),
          cells(
            "Local factor and running product",
            [round(1 - row.state * row.state), round(row.local), row.product],
            [
              "tanh slope 1-h*h",
              "Recurrent weight times local slope",
              "Derivative of current state with respect to initial state",
            ],
          ),
          line(
            "Running derivative product",
            trace.map((row) => row.product),
            "rnn-task-derivative",
            [step],
          ),
          pipe("Weight extraction for the one-unit library check", [
            "Input kernel [1,1] gives inputWeight",
            "Recurrent kernel [1,1] gives recurrentWeight",
            "Bias [1] gives bias",
            "Use this same layer's values when comparing every time step",
          ]),
        ],
        answer: quantity === 1 ? row.product : row.state,
        answerLabel:
          quantity === 1 ? "Running state derivative" : "Hidden state",
        explanation: `At step ${step}, ${round(row.inputTerm)} from the input plus ${round(row.stateTerm)} from the prior state plus bias ${bias} gives ${round(row.sum)}. tanh gives ${round(row.state)}. Multiply the preceding derivative product by ${memory}*(1-h*h)=${round(row.local)} to get ${row.product}. A new call starts again at state zero. This scalar path can shrink or grow and does not diagnose the story network.`,
        code: `const previousState = ${row.old};\nconst currentInput = ${row.reading};\nconst nextState = Math.tanh(${memory} * previousState + ${inputWeight} * currentInput + ${bias});\nconst localFactor = ${memory} * (1 - nextState * nextState);\nconst runningProduct = ${row.product};`,
      };
    },
  },
  "sliding-windows": {
    title: "Classification windows on either side of a split",
    brief:
      "Select one candidate window. Check its source indices, last-reading label, and whether the split keeps or drops it.",
    boundary:
      "This is the exercise's twelve-row synthetic stream. Values equal original row indices. Supplied external labels are 1 at indices 4-8 and 0 elsewhere. They are diagnostic labels, not labels for sample 7741. Classification uses the label of the last input reading, rather than the next-reading forecasting target.",
    controls: [
      range("split", "First evaluation row index", 8, 0, 12),
      range("window", "Readings per classification window", 4, 1, 12),
      {
        ...range("start", "Candidate start index", 4, 0, 11),
        maxFor: (v) => 12 - v.window!,
      },
    ],
    cases: [
      {
        id: "standard",
        label: "Supplied four-reading split",
        description:
          "Starts with length 4, split before index 8. Five training windows, one evaluation window, three crossing windows omitted.",
        values: { split: 8, window: 4, start: 4 },
      },
      {
        id: "changed",
        label: "Alternate split preset",
        description:
          "Starts with length 3, split before index 6. Inspect candidate membership and its external last-reading label.",
        values: { split: 6, window: 3, start: 4 },
      },
    ],
    prediction: {
      prompt: "Where does the selected candidate window belong?",
      choices: ["training", "evaluation", "dropped"],
    },
    evaluate: ({ split, window, start }) => {
      const out = classificationWindows(window, split),
        end = start + window,
        last = end - 1,
        label = CLASSIFICATION_LABELS[last]!,
        answer =
          end <= split ? "training" : start >= split ? "evaluation" : "dropped";
      return {
        graphics: [
          line(
            "Original source indices",
            CLASSIFICATION_ROWS.flat(),
            "split-source-index",
            Array.from({ length: window }, (_, i) => start + i),
          ),
          cells(
            "External classification labels",
            CLASSIFICATION_LABELS,
            CLASSIFICATION_LABELS.map((_, i) => `Row ${i}`),
            [last],
            4,
          ),
          cells(
            "Selected candidate and target",
            [start, last, split, label, answer],
            [
              "First included index",
              "Last included index",
              "First evaluation index",
              "External label at last index",
              "Membership",
            ],
          ),
          cells(
            "All retained windows and labels",
            [
              ...out.train.xs.map(
                (rows, i) =>
                  `Training ${JSON.stringify(rows.flat())}: label ${out.train.ys[i]}`,
              ),
              ...out.eval.xs.map(
                (rows, i) =>
                  `Evaluation ${JSON.stringify(rows.flat())}: label ${out.eval.ys[i]}`,
              ),
              ...out.dropped.map(
                (i) => `Dropped crossing window: ${i}-${i + window - 1}`,
              ),
            ],
            undefined,
            undefined,
            1,
          ),
          pipe("Split first, then form complete windows", [
            `Training rows have indices below ${split}`,
            `Evaluation rows begin at ${split}`,
            `${out.train.xs.length} training windows, ${out.eval.xs.length} evaluation windows`,
            `${out.dropped.length} crossing windows belong to neither set`,
            `No source row appears in both retained sets`,
          ]),
        ],
        answer,
        answerLabel: "Selected window membership",
        explanation: `The candidate covers [${start},${end}), ending at row ${last}, whose supplied label is ${label}. ${answer === "dropped" ? `It crosses the split at ${split}, so keep it in neither set.` : answer === "training" ? `Its exclusive end ${end} is <= ${split}, so it is wholly training.` : `Its start ${start} is >= ${split}, so it is wholly evaluation.`} The target is an external label for the last included reading. It is not the following reading. No source indices are shared across the retained sets.`,
        code: `const start = ${start};\nconst endExclusive = start + ${window};\nconst splitAt = ${split};\nconst lastReadingIndex = endExclusive - 1;\nconst lastReadingLabel = ${label};\n// Membership of this supplied candidate: ${answer}.`,
      };
    },
  },
  "sequence-prediction": {
    title: "A predicted row, converted limits, and the next input",
    brief:
      "Trace the supplied stand-in model one step at a time. Inspect the three z-score outputs, clamp them with saved per-feature bounds, then follow the clamped row into the next window.",
    boundary:
      "This activity uses the exercise's deterministic forecast stand-in and supplied z-score seed, not the trained LSTM. The two cases use the supplied COARSE and TIGHT scalers. There are no future observations here, so this trace measures no accuracy and cannot reproduce the mission's 47-minute forecast.",
    controls: [
      range("steps", "Forecast steps", 4, 0, 6),
      {
        ...range("selected", "Forecast step to inspect", 1, 1, 6),
        maxFor: (v) => Math.max(1, v.steps!),
      },
      choice("feature", "Selected feature", [
        "Amplitude z-score",
        "Crossing-count z-score",
        "Phase z-score",
      ]),
      choice("window", "Input window rows", ["3 rows", "5 rows"], 0, [3, 5]),
    ],
    cases: [
      {
        id: "standard",
        label: "COARSE scaler preset",
        description:
          "Supplied means [1024,32,0], scales [512,16,1]. Initial amplitude bounds are -2 to 2 in model space.",
      },
      {
        id: "changed",
        label: "TIGHT scaler preset",
        description:
          "Supplied means [900,28,0], scales [300,12,1.2]. The same numeric seed has a different declared scaling contract.",
      },
    ],
    prediction: {
      prompt:
        "What clamped z-score does the selected step and feature return? Enter none for zero steps.",
      tolerance: 0.001,
    },
    evaluate: ({ steps, selected, feature, window }, caseId) => {
      const scaler = FORECAST_SCALERS[caseId as keyof typeof FORECAST_SCALERS],
        result = controlledForecast(scaler, window, steps),
        bound = result.bounds[feature]!,
        names = ["Amplitude", "Crossing count", "Phase"],
        row = result.trace[selected - 1];
      const graphics: InvestigationGraphic[] = [
        cells(
          "Saved feature scaling and physical limits",
          [
            names[feature]!,
            FORECAST_LIMITS[feature]!.min,
            FORECAST_LIMITS[feature]!.max,
            scaler.mean[feature]!,
            scaler.std[feature]!,
            bound.min,
            bound.max,
          ],
          [
            "Selected feature",
            "Physical minimum",
            "Physical maximum",
            "Saved training mean",
            "Saved training standard deviation",
            "Minimum z-score",
            "Maximum z-score",
          ],
        ),
      ];
      if (row) {
        graphics.push(
          cells(
            "Selected model input, rows then three features",
            row.input.flat().map(round),
            row.input.flatMap((_, i) =>
              names.map(
                (name) =>
                  `${5 + selected - 1 - window + i < 5 ? "Seed row " + (5 + selected - 1 - window + i) : "Forecast step " + (selected - window + i)}: ${name} z-score`,
              ),
            ),
            undefined,
            3,
          ),
          cells(
            "Raw prediction from the supplied stand-in",
            row.raw.map(round),
            names,
            [feature],
            3,
          ),
          cells(
            "Clamped row returned and fed back",
            row.bounded.map(round),
            names,
            [feature],
            3,
          ),
          cells(
            "Next input window after appending the clamped row",
            row.next.flat().map(round),
            row.next.flatMap((_, i) =>
              names.map(
                (name) =>
                  `${5 + selected - window + i < 5 ? "Seed row " + (5 + selected - window + i) : "Forecast step " + (selected - window + i + 1)}: ${name} z-score`,
              ),
            ),
            undefined,
            3,
          ),
          line(
            "Selected feature across predicted steps",
            result.rows.map((row) => row[feature]!),
            `forecast-task-zscore-${feature}`,
            [selected - 1],
            result.rows.map((_, i) => String(i + 1)),
          ),
        );
      } else
        graphics.push(
          pipe("Zero-step forecast", [
            "Return []",
            "Do not call model.predict",
            "Keep the supplied seed unchanged",
          ]),
        );
      return {
        graphics,
        answer: row ? row.bounded[feature]! : "none",
        answerLabel: "Selected clamped z-score",
        explanation: row
          ? `Step ${selected} reads the last ${window} history rows as [1,${window},3]. For ${names[feature]}, convert physical limits with (limit - ${scaler.mean[feature]}) / ${scaler.std[feature]}. The raw prediction ${round(row.raw[feature]!)} becomes ${round(row.bounded[feature]!)} inside [${round(bound.min)},${round(bound.max)}]. Append that clamped row before the next prediction, leaving the caller's seed unchanged. This supplied arithmetic stand-in is separate from the trained-model result table.`
          : "Zero steps return no predictions and make no model call. The scaler contract still needs valid three-feature means and positive scales. No observed future values are supplied for an error calculation.",
        code: `const physicalLimits = ${JSON.stringify(FORECAST_LIMITS)};\nconst savedMean = ${JSON.stringify(scaler.mean)};\nconst savedStd = ${JSON.stringify(scaler.std)};\nconst bounds = physicalLimits.map((limit,j)=>({ min:(limit.min-savedMean[j])/savedStd[j], max:(limit.max-savedMean[j])/savedStd[j] }));\nconst rawPrediction = ${row ? JSON.stringify(row.raw) : "null"};\nconst clamped = rawPrediction && rawPrediction.map((value,j)=>Math.min(Math.max(value,bounds[j].min),bounds[j].max));`,
      };
    },
  },
};
