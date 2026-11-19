import { RECURRENT_TASK_INVESTIGATIONS } from "./recurrent-task-investigations";
import { ANOMALY_CLARITY } from "./anomaly-clarity-investigations";
import { TIME_SERIES_CLARITY } from "./time-series-clarity-investigations";
import { SIGNAL_TASK_INVESTIGATIONS } from "./signal-task-investigations";
import { WORKED_PACKET } from "../mdx/channel-layout-data";
import type {
  InvestigationControl,
  InvestigationGraphic,
  LessonInvestigationSpec,
} from "./investigation-types";
import {
  FIRST_PACKET,
  READING_VALUES,
  NORMALIZATION_ROWS,
  SCREENING_CASES,
} from "./instrument-math";

import {
  QUANTIZATION_CASES,
  quantizedKernel,
  pruningReference,
  PRUNING_CLASS_NAMES,
} from "./optimization-examples";

const sum = (values: number[]) =>
  values.reduce((total, value) => total + value, 0);
const mean = (values: number[]) => sum(values) / values.length;
const rounded = (value: number) => Math.round(value * 1000) / 1000;
const show = (values: number[]) => values.map(rounded).join(", ");
const changed = (caseId: string) => caseId === "changed";
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
  kind: "range",
  initial,
  min,
  max,
  step,
});
const choice = (
  id: string,
  label: string,
  initial: number,
  labels: string[],
  values = labels.map((_, index) => index),
): InvestigationControl => ({
  id,
  label,
  kind: "choice",
  initial,
  options: labels.map((label, index) => ({ label, value: values[index]! })),
});
const cells = (
  label: string,
  values: Array<number | string>,
  columns = values.length,
  highlight?: number[],
): InvestigationGraphic => ({
  kind: "cells",
  label,
  values,
  columns,
  highlight,
});
const bars = (
  label: string,
  values: number[],
  labels?: string[],
  scaleGroup?: string,
): InvestigationGraphic => ({
  kind: "bars",
  label,
  values: values.map(rounded),
  labels,
  scaleGroup,
});
const line = (
  label: string,
  values: number[],
  highlight?: number[],
  labels = values.map((_, index) => String(index)),
  scaleGroup?: string,
): InvestigationGraphic => ({
  kind: "line",
  label,
  values: values.map(rounded),
  highlight,
  labels,
  scaleGroup,
});
const pipe = (label: string, values: string[]): InvestigationGraphic => ({
  kind: "pipeline",
  label,
  values,
});
const cases = (
  first: string,
  second: string,
  firstDescription: string,
  secondDescription: string,
  firstValues: Record<string, number> = {},
  secondValues: Record<string, number> = {},
) => [
  {
    id: "standard",
    label: first,
    description: firstDescription,
    values: firstValues,
  },
  {
    id: "changed",
    label: second,
    description: secondDescription,
    values: secondValues,
  },
];
const teaching =
  "Small example values. This activity does not train a model or read the ship’s sensor data.";

export const NUMERIC_INVESTIGATIONS: Record<string, LessonInvestigationSpec> = {
  "introduction-to-tensors": {
    title: "Track a reading into its tensor",
    brief:
      "Pick a position in the packet. Check the value at the same position after creating a tensor.",
    boundary:
      "This diagram follows values into a tensor. The lesson's coding activity creates the actual TensorFlow.js tensor.",
    controls: [range("position", "Reading index", 2, 0, 4)],
    cases: cases(
      "First packet",
      "New packet",
      "Five readings from the first example.",
      "A second packet has five different readings.",
      { position: 2 },
      { position: 3 },
    ),
    prediction: {
      prompt: "Which value will be at your selected position in the tensor?",
      tolerance: 0.005,
    },
    evaluate: ({ position }, caseId) => {
      const input = changed(caseId)
        ? [0.63, 0.18, 0.72, 0.26, 0.81]
        : FIRST_PACKET;
      const answer = input[position]!;
      return {
        graphics: [
          cells("JavaScript array", input, 5, [position]),
          cells("Tensor values, shape [5]", input, 5, [position]),
        ],
        answer,
        answerLabel: `Value at position ${position}`,
        explanation: `Position ${position} contains ${answer} in both containers. Creating a tensor preserves the order.`,
        code: `const tensor = tf.tensor1d([${show(input)}]);\n// tensor data at index ${position}: ${answer}`,
      };
    },
  },
  "tensor-shapes": {
    title: "Reading positions after a reshape",
    brief:
      "Choose how many numbers go in each row, then pick a number in the list. Find its row in the reshaped grid.",
    boundary: teaching,
    controls: [
      choice(
        "columns",
        "Columns per row",
        3,
        ["2 columns", "3 columns", "6 columns"],
        [2, 3, 6],
      ),
      range("position", "Input index", 4, 0, 5),
    ],
    cases: cases(
      "Six readings",
      "Another list",
      "The original six readings.",
      "Six new readings, still in their original order.",
      { columns: 3, position: 4 },
      { columns: 2, position: 4 },
    ),
    prediction: {
      prompt: "Which row index contains the selected reading?",
      tolerance: 0,
    },
    evaluate: ({ columns, position }, caseId) => {
      const input = changed(caseId) ? [14, 2, 8, 6, 10, 4] : READING_VALUES;
      const row = Math.floor(position / columns),
        column = position % columns;
      return {
        graphics: [
          cells("Original list, shape [6]", input, 6, [position]),
          cells(
            `Reshaped values, shape [${6 / columns}, ${columns}]`,
            input,
            columns,
            [position],
          ),
        ],
        answer: row,
        answerLabel: "Row index",
        explanation: `The number ${input[position]} is now at row ${row}, column ${column}. Reshape fills each row in order and keeps all six numbers.`,
        code: `const grid = tf.tensor1d(values).reshape([${6 / columns}, ${columns}]);\n// flat index ${position} becomes [${row}, ${column}]`,
      };
    },
  },
  "tensor-operations": {
    title: "Trace the repaired feed",
    brief:
      "Use sensors A and B from Demir's three-moment excerpt. Average the selected rows, apply the gain, then follow one channel-bank sum.",
    boundary:
      "These are selections from the fictional recording used in Tensor Shapes. The header supplies sensor order A, B. Moment numbers are local to that excerpt. No physical unit was supplied. Gains and bank weights are dimensionless settings chosen for this calculation. This diagram calculates the shown example, not the full recording.",
    controls: [
      choice("stage", "Calculation", 0, [
        "Average and gain",
        "Channel-bank sums",
      ]),
      range("gain", "Gain after averaging", 2, 0, 3, 0.25),
      range("row", "Output row index", 0, 0, 1),
      {
        ...range("column", "Output column index", 0, 0, 2),
        maxFor: ({ stage }) => (stage === 0 ? 1 : 2),
      },
    ],
    cases: cases(
      "Adjacent moments",
      "Fixed first-moment reference",
      "Pair moments 1 and 2, then moments 2 and 3. Both views keep sensor A before sensor B.",
      "Blend moments 1 and 2 with the first moment [2, 20] reused as one reference row. This is a chosen reference blend, not a second capture.",
      { stage: 0, gain: 2, row: 0, column: 0 },
      { stage: 0, gain: 1, row: 1, column: 1 },
    ),
    prediction: {
      prompt: "What value will the selected output row and column contain?",
      tolerance: 0.01,
    },
    evaluate: ({ stage, gain, row, column }, caseId) => {
      const input = WORKED_PACKET.slice(0, 2).map((values) =>
        values.slice(0, 2),
      );
      const reference = changed(caseId);
      const second = reference
        ? [WORKED_PACKET[0]!.slice(0, 2)]
        : WORKED_PACKET.slice(1, 3).map((values) => values.slice(0, 2));
      const averaged = input.map((values, r) =>
        values.map((value, c) => (value + second[reference ? 0 : r]![c]!) / 2),
      );
      const boosted = averaged.map((values) =>
        values.map((value) => value * gain),
      );
      const weights = [
        [1, 0],
        [0, 1],
        [1, 1],
      ];
      const transposed = [
        weights.map((bank) => bank[0]!),
        weights.map((bank) => bank[1]!),
      ];
      const mixed = boosted.map((values) =>
        weights.map((bank) => sum(values.map((value, c) => value * bank[c]!))),
      );
      const mixing = stage === 1;
      const selectedColumn = Math.min(column, mixing ? 2 : 1);
      const selected = row * 2 + selectedColumn;
      const contributors = [row * 2, row * 2 + 1];
      const inputHighlights = mixing ? contributors : [selected];
      const secondHighlights = mixing
        ? [reference ? 0 : row * 2, reference ? 1 : row * 2 + 1]
        : [(reference ? 0 : row * 2) + selectedColumn];
      const graphics = [
        cells(
          "First view [2, 2]: rows are moments 1 and 2, columns are A and B",
          input.flat(),
          2,
          inputHighlights,
        ),
        cells(
          reference
            ? "Reference [2]: moment 1, sensors A and B, reused for both rows"
            : "Second view [2, 2]: rows are moments 2 and 3, columns are A and B",
          second.flat(),
          2,
          secondHighlights,
        ),
        cells(
          "Average [2, 2]: one row per pair, columns A and B",
          averaged.flat(),
          2,
          inputHighlights,
        ),
        cells(
          "After gain [2, 2]: one row per pair, columns A and B",
          boosted.flat(),
          2,
          inputHighlights,
        ),
      ];
      const dataCode = `const pass1 = tf.tensor2d(${JSON.stringify(input)});\nconst pass2 = tf.${reference ? "tensor1d" : "tensor2d"}(${JSON.stringify(reference ? second[0] : second)});\nconst { merged, boosted } = tf.tidy(() => {\n  const merged = pass1.add(pass2).div(2);\n  return { merged, boosted: merged.mul(${gain}) };\n});`;
      const pair = reference
        ? `moment ${row + 1} and the moment 1 reference`
        : `moments ${row + 1} and ${row + 2}`;
      if (!mixing) {
        const sensor = selectedColumn === 0 ? "A" : "B";
        const answer = boosted[row]![selectedColumn]!;
        return {
          graphics,
          answer,
          answerLabel: `Row ${row}, sensor ${sensor}`,
          explanation: `Sensor ${sensor}, ${pair}: (${input[row]![selectedColumn]} + ${second[reference ? 0 : row]![selectedColumn]}) / 2 = ${averaged[row]![selectedColumn]}. Gain ${gain} gives ${rounded(answer)}. ${reference ? "Broadcasting reuses the same reference value for this sensor in each row." : "The two views pair adjacent moments while keeping the sensor columns aligned."}`,
          code: `${dataCode}\n// selected boosted[${row}, ${selectedColumn}] = ${rounded(answer)}\ntf.dispose([pass1, pass2, merged, boosted]);`,
        };
      }
      const products = boosted[row]!.map(
        (value, c) => value * weights[selectedColumn]![c]!,
      );
      graphics.push(
        cells(
          "Weights [3, 2]: rows Bank 0, 1, 2, columns A and B",
          weights.flat(),
          2,
          [selectedColumn * 2, selectedColumn * 2 + 1],
        ),
        cells(
          "Transposed weights [2, 3]: rows A and B, columns Bank 0, 1, 2",
          transposed.flat(),
          3,
          [selectedColumn, 3 + selectedColumn],
        ),
        cells(
          `Row ${row}, Bank ${selectedColumn}: A and B contributions`,
          products,
          2,
          [0, 1],
        ),
        cells(
          "Bank sums [2, 3]: rows are moment pairs, columns Bank 0, 1, 2",
          mixed.flat(),
          3,
          [row * 3 + selectedColumn],
        ),
      );
      const answer = mixed[row]![selectedColumn]!;
      return {
        graphics,
        answer,
        answerLabel: `Row ${row}, Bank ${selectedColumn}`,
        explanation: `First average ${pair} and apply gain ${gain}. Row ${row} then holds A = ${boosted[row]![0]} and B = ${boosted[row]![1]}. Bank ${selectedColumn} uses weights [${show(weights[selectedColumn]!)}]. Its dot product is ${boosted[row]![0]} * ${weights[selectedColumn]![0]} + ${boosted[row]![1]} * ${weights[selectedColumn]![1]} = ${rounded(answer)}. Transpose places each bank's two weights in one column, so [2, 2] times [2, 3] gives [2, 3].`,
        code: `${dataCode}\nconst mix = tf.tensor2d(${JSON.stringify(weights)});\nconst mixed = tf.tidy(() => boosted.matMul(mix.transpose()));\n// selected mixed[${row}, ${selectedColumn}] = ${rounded(answer)}\ntf.dispose([pass1, pass2, merged, boosted, mix, mixed]);`,
      };
    },
  },
  "data-loading": {
    title: "Trace a row through the loader",
    brief:
      "Choose a batch and inspect its row IDs, three feature slots, and paired labels. Follow the same 16 practice rows used in the challenge.",
    boundary:
      "This JavaScript illustration uses the exercise's generated values, not ship measurements. Labels equal row ID % 2 and have no anomaly meaning. The fixed shuffled order shows one possible arrangement. Your TensorFlow.js run shuffles randomly.",
    controls: [
      choice(
        "size",
        "Rows per batch",
        4,
        ["2 rows", "4 rows", "8 rows"],
        [2, 4, 8],
      ),
      {
        ...range("batch", "Batch index", 1, 0, 7),
        maxFor: ({ size }) => 16 / size! - 1,
      },
    ],
    cases: cases(
      "Practice row order",
      "Fixed row shuffle",
      "Practice IDs run from 0 through 15. IDs 0-11 belong to training and 12-15 to validation.",
      "This fixed permutation moves whole rows before batching. Split membership stays attached to each ID.",
      { size: 4, batch: 1 },
      { size: 2, batch: 2 },
    ),
    prediction: {
      prompt: "Which row ID will be first in the selected batch?",
      tolerance: 0,
    },
    evaluate: ({ size, batch }, caseId) => {
      const order = changed(caseId)
        ? [2, 0, 3, 1, 6, 4, 7, 5, 10, 8, 11, 9, 14, 12, 15, 13]
        : Array.from({ length: 16 }, (_, i) => i);
      const selected = order.slice(batch * size, (batch + 1) * size);
      return {
        graphics: [
          cells(
            "Practice row IDs in pipeline order",
            order,
            8,
            selected.map((_, index) => batch * size + index),
          ),
          cells(
            `Selected features: amplitude, crossings, phase slots, shape [${size}, 3]`,
            selected.flatMap((id) => [id * 100, id, id / 10]),
            3,
          ),
          cells(
            `Paired labels in the same row order, shape [${size}, 1]`,
            selected.map((id) => id % 2),
            1,
          ),
          pipe("Bare generator read trace, before shuffle or batching", [
            "Create iterator: 0 reads",
            "First next(): read row 0, yield once, 1 read",
            "Second next(): read row 1, yield once, 2 reads",
            "Fresh iterator: starts at row 0 again",
          ]),
          cells(
            "Assigned split by row ID, before any shuffle",
            Array.from(
              { length: 16 },
              (_, id) => `${id}: ${id < 12 ? "Training" : "Validation"}`,
            ),
            4,
            selected,
          ),
        ],
        answer: selected[0]!,
        answerLabel: "First row ID in the batch",
        explanation: `Batch ${batch} takes pipeline positions ${batch * size} through ${(batch + 1) * size - 1}: row IDs ${selected.join(", ")}. Features and labels move together. Row ${selected[0]} keeps [${selected[0]! * 100}, ${selected[0]}, ${selected[0]! / 10}] with label ${selected[0]! % 2}. This batching demonstration reads all 16 rows. Training would read IDs 0-11 only, leaving 12-15 for validation. The bare-generator trace shows one read per request. A shuffle buffer reads ahead before a batch arrives.`,
        code: `// Fixed JavaScript illustration of the challenge's practice reader.\nconst order = [${order.join(", ")}];\nconst selectedIds = order.slice(${batch * size}, ${(batch + 1) * size});\nconst features = selectedIds.map(id => [id * 100, id, id / 10]);\nconst labels = selectedIds.map(id => [id % 2]);\n// Feature shape: [${size}, 3]. Label shape: [${size}, 1].\n// Split membership depends on ID, even after rows move.\nconst selectedSplits = selectedIds.map(id => id < 12 ? 'Training' : 'Validation');`,
      };
    },
  },
  normalization: {
    title: "A reading from scaler to score",
    brief:
      "Follow the challenge's four-row batch. Apply its saved statistics to one row, then inspect the supplied neuron's calculation.",
    boundary:
      "This JavaScript reference uses the challenge's two-feature practice fixture and fixed weights. The fixture specifies no physical units or timestamps. Changing a reading reuses the saved training statistics. This activity performs no TensorFlow.js prediction or training.",
    controls: [
      range("temperature", "New temperature reading", 24, 18, 30, 0.5),
      range("signal", "New signal-strength reading", 0.4, 0, 1.2, 0.1),
      choice("method", "Scaling rule", 1, ["Raw values", "Z-score", "Min-max"]),
    ],
    cases: cases(
      "Challenge row 3",
      "Later reading",
      "The row [24, 0.4] appears in the supplied four-row training batch.",
      "The later row [30, 0.6] exceeds the fitted temperature maximum. The training batch stays unchanged.",
      { temperature: 24, signal: 0.4, method: 1 },
      { temperature: 30, signal: 0.6, method: 2 },
    ),
    prediction: {
      prompt:
        "What is the first feature of the new row after the selected scaling rule?",
      tolerance: 0.015,
    },
    evaluate: ({ temperature, signal, method }) => {
      const training = NORMALIZATION_ROWS;
      const columns = [0, 1].map((column) =>
        training.map((row) => row[column]!),
      );
      const means = columns.map(mean);
      const stds = columns.map((column, index) =>
        Math.sqrt(mean(column.map((value) => (value - means[index]!) ** 2))),
      );
      const minimum = columns.map((column) => Math.min(...column));
      const maximum = columns.map((column) => Math.max(...column));
      const raw = [temperature, signal];
      const offset = method === 1 ? means : minimum;
      const scale =
        method === 1 ? stds : maximum.map((value, i) => value - minimum[i]!);
      const output =
        method === 0
          ? raw
          : raw.map(
              (value, i) =>
                (value - offset[i]!) / (scale[i] === 0 ? 1 : scale[i]!),
            );
      const weights = [0.9, -1.4];
      const terms = output.map((value, i) => value * weights[i]!);
      const weightedSum = sum(terms) - 0.3;
      const score = 1 / (1 + Math.exp(-weightedSum));
      const selectedRow = training.findIndex((row) =>
        row.every((value, i) => value === raw[i]),
      );
      const scaling =
        method === 0
          ? "Raw features keep their original scales."
          : method === 1
            ? `Temperature uses (${temperature} - ${means[0]}) / ${rounded(stds[0]!)}. Signal strength uses (${signal} - ${means[1]}) / ${rounded(stds[1]!)}. These are the saved training statistics.`
            : `Temperature uses (${temperature} - ${minimum[0]}) / ${maximum[0]! - minimum[0]!}. Signal strength uses (${signal} - ${minimum[1]}) / ${rounded(maximum[1]! - minimum[1]!)}. A later value can fall outside [0, 1].`;
      return {
        graphics: [
          bars(
            "New row before scaling",
            raw,
            ["Temperature", "Signal"],
            "raw-features",
          ),
          cells(
            "Training rows: temperature, signal strength",
            training.flat(),
            2,
            selectedRow < 0 ? [] : [selectedRow * 2, selectedRow * 2 + 1],
          ),
          pipe("Saved training statistics", [
            `Temperature: mean ${means[0]}, std ${rounded(stds[0]!)}, min ${minimum[0]}, max ${maximum[0]}`,
            `Signal strength: mean ${means[1]}, std ${rounded(stds[1]!)}, min ${minimum[1]}, max ${maximum[1]}`,
          ]),
          bars(
            "New row after scaling",
            output,
            ["Temperature", "Signal"],
            method === 0
              ? "raw-features"
              : method === 1
                ? "z-score-features"
                : "min-max-features",
          ),
          pipe("Supplied fixed neuron", [
            `Temperature term: ${rounded(output[0]!)} × 0.9 = ${rounded(terms[0]!)}`,
            `Signal term: ${rounded(output[1]!)} × -1.4 = ${rounded(terms[1]!)}`,
            `Add bias -0.3: weighted sum ${rounded(weightedSum)}`,
            `Sigmoid score: ${rounded(score)}`,
          ]),
        ],
        answer: output[0]!,
        answerLabel: "Scaled temperature",
        explanation: `${scaling} The fixed weights and bias give score ${rounded(score)}. Switching the scaler changes the model's inputs without training its weights. This score does not measure accuracy or establish an event label.`,
        code: `const reading = [${raw.join(", ")}];\nconst offset = [${offset.join(", ")}];\nconst scale = [${scale.join(", ")}];\nconst scaled = ${method === 0 ? "reading" : "reading.map((value, i) => (value - offset[i]) / (scale[i] === 0 ? 1 : scale[i]))"};\nconst weightedSum = scaled[0] * 0.9 + scaled[1] * -1.4 - 0.3;\nconst score = 1 / (1 + Math.exp(-weightedSum));`,
      };
    },
  },
  "first-neuron": {
    title: "Every contribution to one score",
    brief:
      "Select an input, then trace its value and weight into the running sum. Change the second weight or bias and predict the final score.",
    boundary:
      "This uses the lesson's supplied arithmetic inputs [0.5, 0.8, 0.2], with dimensionless example values. They are separate from the calibration-tone recordings. The first and third weights stay at 0.4 and 0.6. This calculation performs no training.",
    controls: [
      choice("selected", "Input to inspect", 1, [
        "Input 1",
        "Input 2",
        "Input 3",
      ]),
      range("weight", "Weight on input 2", -0.2, -1, 1, 0.1),
      range("bias", "Bias", 0.1, -1, 1, 0.1),
    ],
    cases: cases(
      "Initial weight preset",
      "Alternate weight preset",
      "This preset starts with inputs [0.5, 0.8, 0.2], weights [0.4, -0.2, 0.6], and bias 0.1.",
      "This preset starts with the same inputs, weights [0.4, 0.2, 0.6], and bias 0.1. Change the controls to compare another calculation.",
      { selected: 1, weight: -0.2, bias: 0.1 },
      { selected: 1, weight: 0.2, bias: 0.1 },
    ),
    prediction: {
      prompt: "What scalar score does the weighted sum plus bias produce?",
      tolerance: 0.01,
    },
    evaluate: ({ selected, weight, bias }) => {
      const input = [0.5, 0.8, 0.2];
      const weights = [0.4, weight, 0.6];
      const products = input.map((value, i) => value * weights[i]!);
      const running = products.map((_, i) => sum(products.slice(0, i + 1)));
      const weightedSum = sum(products);
      const answer = weightedSum + bias;
      return {
        graphics: [
          cells("Arithmetic inputs [3]: input 1, input 2, input 3", input, 3, [
            selected,
          ]),
          cells("Matching weights [3]", weights, 3, [selected]),
          {
            ...bars("One product per input", products, [
              "Input 1",
              "Input 2",
              "Input 3",
            ]),
            highlight: [selected],
          },
          cells(
            "Running sum after each input-weight product",
            running.map(rounded),
            3,
            [selected],
          ),
          {
            ...cells(
              "The final addition",
              [rounded(weightedSum), bias, rounded(answer)],
              3,
            ),
            labels: ["Sum of products", "Bias", "Scalar score"],
          },
        ],
        answer,
        answerLabel: "Scalar score",
        explanation: `Input ${selected + 1} contributes ${input[selected]} * ${weights[selected]} = ${rounded(products[selected]!)}. The running sum through that input is ${rounded(running[selected]!)}. All three products total ${rounded(weightedSum)}. Add bias ${bias} to get ${rounded(answer)}. This is a score before activation or a decision threshold.`,
        code: `const inputs = [0.5, 0.8, 0.2];\nconst weights = [0.4, ${weight}, 0.6];\nconst products = inputs.map((value, i) => value * weights[i]);\nconst score = products.reduce((total, value) => total + value, ${bias});`,
      };
    },
  },
  "activation-functions": {
    title: "Each score before and after activation",
    brief:
      "Select a diagnostic score. Compare its input and activated value, then check that the other positions keep the same rule.",
    boundary:
      "These are the supplied activation-check inputs, separate from calibration-tone measurements. This formula illustration does not run or train a network. The challenge applies the same rule with tensor operations.",
    controls: [
      {
        ...range("position", "Score position", 1, 0, 4),
        maxFor: ({ sampleCount }) => sampleCount! - 1,
      },
      choice("function", "Activation", 0, ["ReLU", "Sigmoid", "Tanh"]),
    ],
    cases: cases(
      "Five-score diagnostic",
      "Large-positive diagnostic",
      "The challenge checks [-2, -0.5, 0, 1.5, 3]. Positions start at 0.",
      "The challenge also checks [-2^126, -6.5, 6.5, 2^126]. ReLU keeps both positive values, including the large one.",
      { position: 1, function: 0, sampleCount: 5 },
      { position: 2, function: 0, sampleCount: 4 },
    ),
    prediction: {
      prompt:
        "What value does the selected activation produce at this position?",
      tolerance: 0.015,
    },
    evaluate: ({ position, function: fn }, caseId) => {
      const input = changed(caseId)
        ? [-(2 ** 126), -6.5, 6.5, 2 ** 126]
        : [-2, -0.5, 0, 1.5, 3];
      const activate = (x: number) =>
        fn === 0
          ? Math.max(0, x)
          : fn === 1
            ? 1 / (1 + Math.exp(-x))
            : Math.tanh(x);
      const output = input.map(activate);
      const answer = output[position]!;
      const name = ["ReLU", "Sigmoid", "Tanh"][fn]!;
      const formula =
        fn === 0
          ? "Math.max(0, value)"
          : fn === 1
            ? "1 / (1 + Math.exp(-value))"
            : "Math.tanh(value)";
      return {
        graphics: [
          cells(
            `Diagnostic input, shape [${input.length}]`,
            input,
            input.length,
            [position],
          ),
          cells(
            `${name} output, shape [${input.length}]`,
            output,
            input.length,
            [position],
          ),
          bars(
            "Selected score before and after",
            [input[position]!, answer],
            ["Before activation", "After activation"],
            `activation-comparison-${fn}`,
          ),
        ],
        answer,
        answerLabel: `${name} output at position ${position}`,
        explanation: `Position ${position} contains ${input[position]}. ${name} produces ${rounded(answer)}. ${fn === 0 ? "ReLU replaces negative values with zero and keeps zero and every positive value unchanged. It has no upper limit." : fn === 1 ? "Sigmoid gives a bounded score. Floating-point rounding can reach 0 or 1. A score's range does not establish its reliability." : "Tanh gives a bounded signed value. Floating-point rounding can reach -1 or 1."} The output keeps all ${input.length} positions in the same order.`,
        code: `const inputs = ${JSON.stringify(input)};\nconst output = inputs.map(value => ${formula});\nconst selected = output[${position}];`,
      };
    },
  },
  "layers-and-architecture": {
    title: "Count the trainable parameters",
    brief:
      "Choose the bridge or practice stack. Change its input width, then inspect one layer's weights, biases, and share of the total.",
    boundary:
      "The bridge starts with 3 inputs and 32/16/1 units: 673 parameters. The graded practice stack starts with 4 inputs and 16/8/1 units: 225. Changing input width compares architectures. These counts establish no speed, accuracy, or data provenance.",
    controls: [
      range("inputs", "Input features", 3, 1, 12),
      range("layer", "Layer index to inspect", 0, 0, 2),
    ],
    cases: cases(
      "Bridge classifier: 32/16/1",
      "Practice stack: 16/8/1",
      "Three prepared features enter 32 units, then 16, then one sigmoid output. This is the story's bridge architecture.",
      "Four feature slots enter 16 units, then 8, then one sigmoid output. This is the separate build-layer exercise configuration.",
      { inputs: 3, layer: 0 },
      { inputs: 4, layer: 0 },
    ),
    prediction: {
      prompt:
        "How many trainable parameters does the whole selected network have, including biases?",
      tolerance: 0,
    },
    evaluate: ({ inputs, layer }, caseId) => {
      const units = changed(caseId) ? [16, 8, 1] : [32, 16, 1];
      const incoming = [inputs, units[0]!, units[1]!];
      const weights = units.map((outgoing, i) => incoming[i]! * outgoing);
      const subtotals = weights.map((count, i) => count + units[i]!);
      const total = sum(subtotals);
      return {
        graphics: [
          cells(
            "Widths: input features, hidden layer 1, hidden layer 2, output",
            [inputs, ...units],
            4,
            [layer, layer + 1],
          ),
          cells("Inputs per layer, in model order", incoming, 3, [layer]),
          cells("Units and biases per layer", units, 3, [layer]),
          cells("Weights per layer", weights, 3, [layer]),
          cells("Parameter subtotal per layer", subtotals, 3, [layer]),
          pipe("Selected layer's contribution", [
            `Layer ${layer}: ${incoming[layer]} inputs, ${units[layer]} units`,
            `${incoming[layer]} * ${units[layer]} = ${weights[layer]} weights`,
            `${units[layer]} units supply ${units[layer]} biases`,
            `${weights[layer]} + ${units[layer]} = ${subtotals[layer]} parameters`,
            `Network total: ${subtotals.join(" + ")} = ${total}`,
          ]),
        ],
        answer: total,
        answerLabel: "Total trainable parameters",
        explanation: `Layer ${layer} receives ${incoming[layer]} values and has ${units[layer]} units. Its ${weights[layer]} weights plus ${units[layer]} biases make ${subtotals[layer]} parameters. The network total is ${subtotals.join(" + ")} = ${total}. ${changed(caseId) ? "For this 16/8/1 practice stack, changing only input width gives 16 * width + 161." : "This 32/16/1 bridge stack reaches 673 only at its original input width of 3."} More examples in a batch reuse these parameters.`,
        code: `const inputWidth = ${inputs};\nconst units = [${units.join(", ")}];\nconst incoming = [inputWidth, units[0], units[1]];\nconst weights = units.map((count, index) => incoming[index] * count);\nconst subtotals = weights.map((count, index) => count + units[index]);\nconst total = subtotals.reduce((count, next) => count + next, 0);`,
      };
    },
  },
  "forward-pass": {
    title: "One linear layer, one selected output",
    brief:
      "Follow the challenge's two-feature practice rows through a supplied reference kernel. Select a row and unit, then change one input contribution.",
    boundary:
      "This fixed reference has one linear 2-input, 3-unit layer with 9 parameters. Its hand-chosen kernel and bias are shown below. The graded run keeps default random weights and captures its own values. Neither source is bridge calibration data, and these outputs are not probabilities.",
    controls: [
      {
        ...range("row", "Reading index", 1, 0, 2),
        maxFor: ({ rows }) => rows! - 1,
      },
      range("unit", "Output unit index", 2, 0, 2),
      range("change", "Change to selected Input 1", 0, -2, 2, 0.25),
    ],
    cases: cases(
      "Two practice rows",
      "Three practice rows",
      "Rows [1, 2] and [3, 4] are the challenge's diagnostic inputs. The reference weights keep every product inspectable.",
      "Add [5, 6], the lesson's one-reading example, to the same two-row batch. The layer keeps the same kernel and bias.",
      { rows: 2, row: 1, unit: 2, change: 0 },
      { rows: 3, row: 2, unit: 2, change: 0 },
    ),
    prediction: {
      prompt: "What value will the selected row and output unit contain?",
      tolerance: 0.01,
    },
    evaluate: ({ rows, row, unit, change }) => {
      const input = [
        [1, 2],
        [3, 4],
        [5, 6],
      ].slice(0, rows);
      input[row]![0]! += change;
      const kernel = [
        [0.5, -1, 2],
        [1, 0.25, -0.5],
      ];
      const bias = [0.1, 0.2, -0.3];
      const output = input.map((reading) =>
        bias.map(
          (offset, u) =>
            sum(reading.map((value, feature) => value * kernel[feature]![u]!)) +
            offset,
        ),
      );
      const products = input[row]!.map(
        (value, feature) => value * kernel[feature]![unit]!,
      );
      const answer = output[row]![unit]!;
      return {
        graphics: [
          cells(`Practice inputs, shape [${rows}, 2]`, input.flat(), 2, [
            row * 2,
            row * 2 + 1,
          ]),
          cells(
            "Reference kernel [2, 3]: feature rows, unit columns",
            kernel.flat(),
            3,
            [unit, 3 + unit],
          ),
          cells("Reference bias [3]: one value per unit", bias, 3, [unit]),
          bars(
            `Row ${row}, unit ${unit}: products and bias`,
            [...products, bias[unit]!],
            ["Input 1 product", "Input 2 product", "Bias"],
          ),
          cells(
            `Reference outputs, shape [${rows}, 3]`,
            output.flat().map(rounded),
            3,
            [row * 3 + unit],
          ),
        ],
        answer,
        answerLabel: `Row ${row}, unit ${unit} output`,
        explanation: `The selected row is [${show(input[row]!)}]. Unit ${unit} uses kernel column [${kernel[0]![unit]}, ${kernel[1]![unit]}] and bias ${bias[unit]}. Its dot product is ${input[row]![0]} * ${kernel[0]![unit]} + ${input[row]![1]} * ${kernel[1]![unit]} + ${bias[unit]} = ${rounded(answer)}. Linear activation keeps this sum. One batch of ${rows} rows gives shape [${rows}, 3] with the same 9 parameters. These fixed reference outputs differ from the random-weight challenge run.`,
        code: `const input = ${JSON.stringify(input)};\nconst kernel = ${JSON.stringify(kernel)};\nconst bias = ${JSON.stringify(bias)};\nconst output = input.map(reading => bias.map((offset, unit) => reading.reduce((total, value, feature) => total + value * kernel[feature][unit], offset)));\nconst selected = output[${row}][${unit}];`,
      };
    },
  },
  "building-a-network": {
    title: "Two models and one training run",
    brief:
      "Follow the eight-feature rehearsal from construction to comparison. Predict which stage starts the optimizer updates.",
    boundary:
      "This is a plan for the challenge's generated 120-row rehearsal and 529-parameter models. It calculates schedule counts assuming the selected fit completes. It constructs no model and invents no predictions or training loss. Your Challenge run supplies those measurements.",
    controls: [
      choice("stage", "Stage to inspect", 2, [
        "Construction",
        "Compilation",
        "Initial snapshots and sweeps",
        "First model fitted",
        "Before-and-after comparison",
      ]),
      range("epochs", "Planned epochs", 50, 1, 100),
      choice(
        "batch",
        "Planned batch size",
        16,
        ["8 rows", "16 rows", "32 rows"],
        [8, 16, 32],
      ),
    ],
    cases: cases(
      "Rehearsal schedule preset",
      "Alternate schedule preset",
      "This preset starts with the requested 50 epochs and batch size 16. Change the controls to compare another plan. Both models start independently.",
      "This preset starts at 100 epochs and batch size 32. Those defaults also give 400 updates, with different settings from the challenge's requested run.",
      { stage: 2, epochs: 50, batch: 16 },
      { stage: 4, epochs: 100, batch: 32 },
    ),
    prediction: {
      prompt:
        "If the selected stage completes, how many optimizer updates has the first model made?",
      tolerance: 0,
      unit: "steps",
    },
    evaluate: ({ stage, epochs, batch }) => {
      const batchesPerEpoch = Math.ceil(120 / batch);
      const updates = stage >= 3 ? epochs * batchesPerEpoch : 0;
      const states = [
        [
          "Two separate 8, 24, 12, 1 models",
          "Random kernels and zero biases",
          "No compile or fit yet",
        ],
        [
          "Both models: Adam, binaryCrossentropy, accuracy",
          "Compilation keeps the initialized weights",
          "Both optimizers: 0 updates",
        ],
        [
          "First model: copy 529 initial values into 6 plain arrays",
          "Save 120 untrained scores from each model",
          "Both optimizers: 0 updates",
        ],
        [
          `First model: one completed fit, ${epochs} epochs, batch size ${batch}`,
          `First optimizer: ${updates} updates`,
          "Second model: no fit, starting weights retained",
        ],
        [
          "Read 120 new scores from the first model",
          "Compare with both saved untrained sweeps",
          "Second model stays at its own initial weights",
          "Observed scores and loss come from your Challenge run",
        ],
      ];
      return {
        graphics: [
          {
            ...pipe("Rehearsal stages", [
              "Construct two independent models",
              "Compile each for training",
              "Save initial weights and both untrained sweeps",
              "Fit the first model once",
              "Read its new scores and compare",
            ]),
            highlight: [stage],
          },
          pipe("Parameters in each rehearsal model", [
            "First layer: 8 inputs, 24 units, 192 weights and 24 biases = 216",
            "Second layer: 24 inputs, 12 units, 288 weights and 12 biases = 300",
            "Output: 12 inputs, 1 unit, 12 weights and 1 bias = 13",
            "Total: 529 parameters, stored in 3 kernels and 3 bias tensors",
          ]),
          pipe("State at the selected stage", states[stage]!),
          bars(
            "Optimizer updates after the selected stage",
            [updates, 0],
            ["First model", "Second model"],
            "rehearsal-optimizer-updates",
          ),
          pipe("Planned fit settings", [
            "120 generated training rows, 8 dimensionless features each",
            120 % batch === 0
              ? `${batchesPerEpoch} full batches per epoch, ${batch} rows each`
              : `${batchesPerEpoch} batches per epoch, with ${120 % batch} rows in the final batch`,
            `${epochs} epochs times ${batchesPerEpoch} batches = ${epochs * batchesPerEpoch} updates after a completed fit`,
            "No validation split. Reusing these rows cannot establish performance on new data.",
          ]),
        ],
        answer: updates,
        answerLabel: "First model optimizer updates",
        explanation: `${stage < 3 ? "Construction, compilation, snapshots, and prediction leave optimizer updates at zero." : `A completed fit makes ${epochs} * ceil(120 / ${batch}) = ${updates} updates on the first model.`} The second model receives no fit. ${epochs === 50 && batch === 16 ? "This is the requested schedule." : "These settings differ from the requested 50 epochs and batch size 16. An equal update count does not make two schedules equivalent."} This plan supplies no stochastic scores or measured loss. Inspect those in your actual run.`,
        code: `// Schedule calculation only. No model runs here.\nconst rows = 120;\nconst epochs = ${epochs};\nconst batchSize = ${batch};\nconst batchesPerEpoch = Math.ceil(rows / batchSize);\nconst firstModelUpdates = ${stage >= 3 ? "epochs * batchesPerEpoch" : "0"};\nconst secondModelUpdates = 0;`,
      };
    },
  },
  "loss-functions": {
    title: "One row's error and the batch loss",
    brief:
      "Inspect a supplied diagnostic row. Trace squared error into MSE, then compare the two declared binary-output formats.",
    boundary:
      "These are the exercise's arithmetic and binary-label diagnostic inputs, separate from ship measurements and calibration-tone records. The formulas calculate a reference loss. They train no model and establish no performance on new data.",
    controls: [
      choice("stage", "Loss calculation", 0, [
        "Mean squared error",
        "BCE from raw logits",
        "BCE from sigmoid probabilities",
      ]),
      {
        ...range("row", "Row index to inspect", 0, 0, 4),
        maxFor: ({ stage, mseRows }) => (stage === 0 ? mseRows! - 1 : 1),
      },
      range("change", "Change to first prediction or logit", 0, -2, 2, 0.1),
    ],
    cases: cases(
      "Initial diagnostic preset",
      "Alternate diagnostic preset",
      "MSE starts with labels [3, -0.5, 2, 1] and predictions [2.5, 0, 2.1, 1.3]. BCE starts with labels [1, 0] and logits [3, -3].",
      "MSE starts with the supplied five-row labels [1, 0, 1, 0, 1] and raw scores [0.4, -0.4, -0.8, 0.8, 1.4]. BCE starts with labels [1, 0] and logits [-3, 3]. Controls can change the first supplied value.",
      { stage: 0, row: 0, change: 0, mseRows: 4 },
      { stage: 0, row: 0, change: 0, mseRows: 5 },
    ),
    prediction: {
      prompt:
        "What scalar loss does this calculation return for the whole batch?",
      tolerance: 0.001,
    },
    evaluate: ({ stage, row, change }, caseId) => {
      if (stage === 0) {
        const labels = changed(caseId) ? [1, 0, 1, 0, 1] : [3, -0.5, 2, 1];
        const predictions = changed(caseId)
          ? [0.4, -0.4, -0.8, 0.8, 1.4]
          : [2.5, 0, 2.1, 1.3];
        predictions[0]! += change;
        const differences = predictions.map((value, i) => value - labels[i]!);
        const squares = differences.map((value) => value * value);
        const total = sum(squares);
        const answer = total / labels.length;
        return {
          graphics: [
            {
              ...cells(
                "Diagnostic rows: label, prediction",
                labels.flatMap((label, i) => [label, predictions[i]!]),
                2,
                [row * 2, row * 2 + 1],
              ),
              labels: labels.flatMap((_, i) => [
                `Row ${i} label`,
                `Row ${i} prediction`,
              ]),
            },
            cells(
              "Prediction minus label, one difference per row",
              differences.map(rounded),
              labels.length,
              [row],
            ),
            cells(
              "Squared differences, in the same row order",
              squares.map(rounded),
              labels.length,
              [row],
            ),
            pipe("Mean squared error reduction", [
              `Sum of squared differences: ${rounded(total)}`,
              `Divide by all ${labels.length} rows`,
              `Scalar MSE: ${rounded(answer)}`,
            ]),
          ],
          answer,
          answerLabel: "Mean squared error",
          explanation: `Row ${row}: prediction ${predictions[row]} minus label ${labels[row]} gives ${rounded(differences[row]!)}. Its square is ${rounded(squares[row]!)}. Add every row's square, then divide ${rounded(total)} by ${labels.length} to get ${rounded(answer)}. Squaring before averaging prevents opposite-signed errors from cancelling.`,
          code: `const labels = ${JSON.stringify(labels)};\nconst predictions = ${JSON.stringify(predictions)};\nconst differences = predictions.map((value, i) => value - labels[i]);\nconst squares = differences.map(value => value * value);\nconst batchLoss = squares.reduce((total, value) => total + value, 0) / labels.length;`,
        };
      }
      const labels = [1, 0];
      const logits = changed(caseId) ? [-3, 3] : [3, -3];
      logits[0]! += change;
      const probabilities = logits.map((value) => 1 / (1 + Math.exp(-value)));
      const probabilityInput = stage === 2;
      const terms = probabilityInput
        ? probabilities.map(
            (value, i) =>
              -(
                labels[i]! * Math.log(value) +
                (1 - labels[i]!) * Math.log1p(-value)
              ),
          )
        : logits.map(
            (value, i) =>
              Math.max(value, 0) -
              labels[i]! * value +
              Math.log1p(Math.exp(-Math.abs(value))),
          );
      const answer = mean(terms);
      const values = probabilityInput ? probabilities : logits;
      const form = probabilityInput
        ? "binaryCrossentropy"
        : "sigmoidCrossEntropy";
      return {
        graphics: [
          {
            ...cells(
              probabilityInput
                ? "Diagnostic rows: label, sigmoid probability"
                : "Diagnostic rows: label, raw logit",
              labels.flatMap((label, i) => [label, values[i]!]),
              2,
              [row * 2, row * 2 + 1],
            ),
            labels: labels.flatMap((_, i) => [
              `Row ${i} label`,
              `Row ${i} ${probabilityInput ? "probability" : "logit"}`,
            ]),
          },
          cells(
            probabilityInput
              ? "Corresponding raw logits before sigmoid"
              : "Corresponding sigmoid probabilities",
            probabilityInput ? logits : probabilities,
            2,
            [row],
          ),
          cells("Binary cross-entropy term for each row", terms, 2, [row]),
          pipe("Declared output contract", [
            probabilityInput
              ? "probabilities: sigmoid already ran"
              : "logits: raw scores before sigmoid",
            probabilityInput
              ? "Compile loss: binaryCrossentropy"
              : "Tensor loss: tf.losses.sigmoidCrossEntropy",
            probabilityInput
              ? "Pass the probabilities directly"
              : "Pass logits directly. This API applies sigmoid internally.",
            `Mean of both row terms: ${rounded(answer)}`,
          ]),
        ],
        answer,
        answerLabel: "Mean binary cross-entropy",
        explanation: `Row ${row} has label ${labels[row]}, logit ${logits[row]}, and sigmoid score ${rounded(probabilities[row]!)}. Its BCE term is about ${rounded(terms[row]!)}. Average both terms to get about ${rounded(answer)}. The declared ${probabilityInput ? "probabilities" : "logits"} contract selects ${form}. Using the matching forms gives the same mathematical loss here. Applying sigmoid again changes it.`,
        code: `const labels = [1, 0];\nconst logits = ${JSON.stringify(logits)};\nconst probabilities = logits.map(value => 1 / (1 + Math.exp(-value)));\nconst declaredOutputKind = '${probabilityInput ? "probabilities" : "logits"}';\nconst selectedForm = '${form}';\nconst terms = ${probabilityInput ? "probabilities.map((value, i) => -(labels[i] * Math.log(value) + (1 - labels[i]) * Math.log1p(-value)))" : "logits.map((value, i) => Math.max(value, 0) - labels[i] * value + Math.log1p(Math.exp(-Math.abs(value))))"};\nconst batchLoss = terms.reduce((total, value) => total + value, 0) / labels.length;`,
      };
    },
  },
  "gradient-descent": {
    title: "A weight, its gradient, and the next loss",
    brief:
      "Follow the supplied squared-loss check through three updates. Inspect the old weight, gradient, rate, amount subtracted, new weight, and recomputed loss.",
    boundary:
      "This formula illustration uses the exercise's scalar loss w squared. Its initial preset is w = 5 and rate = 0.1. These values are optimization probes, separate from the ship's classifier. The Challenge differentiates supplied functions with TensorFlow.js. The optional learning-rate experiment uses a different loss.",
    controls: [
      range("weight", "Starting weight", 5, -5, 5, 0.25),
      range("rate", "Learning rate", 0.1, 0, 1.2, 0.05),
      range("update", "Update to inspect", 1, 1, 3),
    ],
    cases: cases(
      "Initial squared-loss preset",
      "Alternate squared-loss preset",
      "This preset starts at weight 5, rate 0.1, on loss w squared. The Challenge's first three updates use those settings.",
      "This preset starts at weight 5 with rate 0.6 on the same squared loss. Change the controls to inspect other updates.",
      { weight: 5, rate: 0.1, update: 1 },
      { weight: 5, rate: 0.6, update: 1 },
    ),
    prediction: {
      prompt: "What weight does the selected update produce?",
      tolerance: 0.001,
    },
    evaluate: ({ weight, rate, update }) => {
      let current = weight;
      const trace = Array.from({ length: 3 }, () => {
        const oldWeight = current;
        const gradient = 2 * oldWeight;
        const amount = rate * gradient;
        current = oldWeight - amount;
        return {
          oldWeight,
          gradient,
          amount,
          nextWeight: current,
          oldLoss: oldWeight * oldWeight,
          nextLoss: current * current,
        };
      });
      const selected = trace[update - 1]!;
      return {
        graphics: [
          pipe("Selected scalar probe", [
            "Loss: w squared",
            `Initial weight: ${weight}`,
            `Learning rate: ${rate}`,
            `Inspect update ${update}`,
          ]),
          {
            ...cells(
              "Values in the selected update",
              [
                selected.oldWeight,
                selected.gradient,
                rate,
                selected.amount,
                selected.nextWeight,
                selected.oldLoss,
                selected.nextLoss,
              ].map(rounded),
              2,
            ),
            labels: [
              "Old weight",
              "Gradient at old weight",
              "Learning rate",
              "Amount to subtract",
              "New weight",
              "Loss before",
              "Recomputed loss after",
            ],
          },
          line(
            "Weight before and after three updates",
            [weight, ...trace.map((row) => row.nextWeight)],
            [update],
            ["Before", "1", "2", "3"],
            "squared-probe-weight",
          ),
          bars(
            "Loss before and after the selected update",
            [selected.oldLoss, selected.nextLoss],
            ["Before update", "After update"],
            "squared-probe-loss",
          ),
          pipe(
            "Three calculated updates on this loss",
            trace.map(
              (row, i) =>
                `Update ${i + 1}: weight ${rounded(row.nextWeight)}, loss ${rounded(row.nextLoss)}`,
            ),
          ),
        ],
        answer: selected.nextWeight,
        answerLabel: `Weight after update ${update}`,
        explanation: `At old weight ${rounded(selected.oldWeight)}, the gradient of w squared is ${rounded(selected.gradient)}. Multiply by rate ${rate} to get ${rounded(selected.amount)}. Subtract that amount: ${rounded(selected.oldWeight)} - (${rounded(selected.amount)}) = ${rounded(selected.nextWeight)}. Recompute loss at the new weight: ${rounded(selected.nextLoss)}, compared with ${rounded(selected.oldLoss)} before. The loss ${selected.nextLoss > selected.oldLoss ? "increases" : selected.nextLoss < selected.oldLoss ? "decreases" : "stays the same"} for this update. This known derivative illustrates the probe. Your step function must differentiate whichever loss it receives.`,
        code: `const rate = ${rate};\nlet weight = ${weight};\nconst trace = [];\nfor (let update = 1; update <= 3; update++) {\n  const oldWeight = weight;\n  const gradient = 2 * oldWeight;\n  weight = oldWeight - rate * gradient;\n  trace.push({ oldWeight, gradient, nextWeight: weight, loss: weight * weight });\n}\nconst selected = trace[${update - 1}];`,
      };
    },
  },
  backpropagation: {
    title: "Two ways to check the same slope",
    brief:
      "Change Demir's test weight. Compare a small nudge with the chain-rule gradient of loss = w squared.",
    boundary:
      "Plain JavaScript calculates this reference for the supplied scalar test loss. The coding task runs TensorFlow.js and compares your two methods. These values are not sensor readings and train no model.",
    controls: [range("weight", "Weight w", 3, -5, 5, 0.25)],
    cases: cases(
      "Starting weight 3",
      "Changed weight 5",
      "The coding task starts with w = 3 and loss = w squared.",
      "The same loss at another weight needs a new gradient.",
      { weight: 3 },
      { weight: 5 },
    ),
    prediction: {
      prompt: "What is the gradient of w squared at the selected weight?",
      tolerance: 0.01,
    },
    evaluate: ({ weight }) => {
      const nudge = 0.001;
      const baseLoss = weight * weight;
      const nudgedWeight = weight + nudge;
      const nudgedLoss = nudgedWeight * nudgedWeight;
      const estimate = (nudgedLoss - baseLoss) / nudge;
      const gradient = weight + weight;
      return {
        graphics: [
          cells(
            "Two nearby weights and their losses",
            [
              `w = ${weight}`,
              `w + 0.001 = ${rounded(nudgedWeight)}`,
              `loss = ${baseLoss}`,
              `nudged loss = ${Number(nudgedLoss.toFixed(6))}`,
            ],
            2,
          ),
          bars(
            "Two calculations of the same slope",
            [gradient, estimate],
            ["Chain-rule gradient", "Numerical estimate"],
            "scalar-loss-gradient",
          ),
          pipe("Weight paths into the loss", [
            `loss = ${weight} × ${weight}`,
            `First path contributes ${weight}`,
            `Second path contributes ${weight}`,
            `Gradient = ${gradient}`,
          ]),
        ],
        answer: gradient,
        answerLabel: "Gradient dL/dw",
        explanation: `The weight appears on both sides of w × w, so its two paths contribute ${weight} + ${weight} = ${gradient}. A nudge of ${nudge} estimates ${rounded(estimate)} from two loss values. Both methods leave the original weight at ${weight}.`,
        code: `const weight = ${weight};\nconst baseLoss = weight * weight;\nconst nudgedLoss = (weight + 0.001) ** 2;\nconst estimate = (nudgedLoss - baseLoss) / 0.001;\nconst gradient = weight + weight;`,
      };
    },
  },
  "training-loop": {
    title: "Two recent windows of loss",
    brief:
      "Choose an observed epoch count. Follow the two ten-epoch means into the trend label.",
    boundary:
      "These chosen diagnostic losses match the lesson's rule probes. They are separate from your measured fit. The validation callback waits for five consecutive non-improvements. Neither rule identifies a cause or restores weights.",
    controls: [
      {
        ...range("observed", "Observed epochs", 50, 1, 50),
        maxFor: (values) => values.available ?? 50,
      },
    ],
    cases: [
      {
        id: "standard",
        label: "Recent windows",
        description:
          "Fifty values per curve. The final twenty are the two diagnostic windows.",
        values: { observed: 50, available: 50 },
      },
      {
        id: "changed",
        label: "Boundary values",
        description:
          "Twenty values per curve, including the exact 5% boundary.",
        values: { observed: 20, available: 20 },
      },
      {
        id: "zero-rise",
        label: "Zero baseline",
        description:
          "Both previous means are zero. Recent values are positive.",
        values: { observed: 20, available: 20 },
      },
      {
        id: "zero-flat",
        label: "Zero pair",
        description: "Validation stays at zero in both windows.",
        values: { observed: 20, available: 20 },
      },
      {
        id: "validation-rise",
        label: "Level training",
        description: "The training windows match. Validation values differ.",
        values: { observed: 20, available: 20 },
      },
      {
        id: "validation-drop",
        label: "Opposing windows",
        description: "The two curves move in different directions.",
        values: { observed: 20, available: 20 },
      },
      {
        id: "boundary-drop",
        label: "Lower boundary",
        description: "Validation reaches exactly 95% of its previous mean.",
        values: { observed: 20, available: 20 },
      },
    ],
    prediction: {
      prompt: "Which label describes these observed loss windows?",
      choices: [
        "insufficient-history",
        "validation-improving",
        "both-worsening",
        "train-down-validation-up",
        "validation-worsening",
        "plateau",
      ],
    },
    evaluate: ({ observed }, caseId) => {
      const fixture =
        caseId === "standard"
          ? { training: [1, 0.8], validation: [1, 1.2], prefix: 30 }
          : caseId === "changed"
            ? { training: [1, 0.8], validation: [1, 1.05], prefix: 0 }
            : caseId === "zero-rise"
              ? { training: [0, 1], validation: [0, 1], prefix: 0 }
              : caseId === "zero-flat"
                ? { training: [1, 1], validation: [0, 0], prefix: 0 }
                : caseId === "validation-rise"
                  ? { training: [1, 1], validation: [1, 1.2], prefix: 0 }
                  : caseId === "validation-drop"
                    ? { training: [1, 1.2], validation: [1, 0.8], prefix: 0 }
                    : { training: [1, 1], validation: [1, 0.95], prefix: 0 };
      const curve = (pair: number[]) =>
        [
          ...Array(fixture.prefix).fill(20),
          ...Array(10).fill(pair[0]),
          ...Array(10).fill(pair[1]),
        ].slice(0, observed) as number[];
      const training = curve(fixture.training);
      const validation = curve(fixture.validation);
      const count = training.length;
      const hasWindows = count >= 20;
      const windows = (values: number[]) => [
        mean(values.slice(-20, -10)),
        mean(values.slice(-10)),
      ];
      const direction = ([before, recent]: number[]) => {
        if (before === 0) return recent === 0 ? "flat" : "up";
        if (recent! < before! * 0.95 - 1e-12) return "down";
        if (recent! > before! * 1.05 + 1e-12) return "up";
        return "flat";
      };
      const trainingMeans = hasWindows ? windows(training) : [];
      const validationMeans = hasWindows ? windows(validation) : [];
      const trainingTrend = hasWindows
        ? direction(trainingMeans)
        : "unavailable";
      const validationTrend = hasWindows
        ? direction(validationMeans)
        : "unavailable";
      const answer = !hasWindows
        ? "insufficient-history"
        : validationTrend === "down"
          ? "validation-improving"
          : validationTrend === "up" && trainingTrend === "up"
            ? "both-worsening"
            : validationTrend === "up" && trainingTrend === "down"
              ? "train-down-validation-up"
              : validationTrend === "up"
                ? "validation-worsening"
                : "plateau";
      const epochLabels = training.map((_, index) => String(index + 1));
      const highlight = hasWindows
        ? Array.from({ length: 20 }, (_, index) => count - 20 + index)
        : [];
      return {
        graphics: [
          line(
            "Observed validation loss by epoch",
            validation,
            highlight,
            epochLabels,
            "training-loss",
          ),
          line(
            "Training loss by epoch",
            training,
            highlight,
            epochLabels,
            "training-loss",
          ),
          ...(hasWindows
            ? [
                cells(
                  "Original epoch windows",
                  [
                    `Previous: ${count - 19}-${count - 10}`,
                    `Recent: ${count - 9}-${count}`,
                  ],
                  2,
                ),
                bars(
                  "Means from the full observed history",
                  [...trainingMeans, ...validationMeans],
                  [
                    "Training previous",
                    "Training recent",
                    "Validation previous",
                    "Validation recent",
                  ],
                ),
                pipe("Observed trend rule", [
                  `Training: ${trainingTrend}`,
                  `Validation: ${validationTrend}`,
                  `Return ${answer}`,
                ]),
              ]
            : [
                pipe("Not enough entries for two windows", [
                  `${count} observed epochs`,
                  "Two windows need 20 entries",
                  "Return insufficient-history",
                ]),
              ]),
        ],
        answer,
        answerLabel: "Full-history trend label",
        explanation: hasWindows
          ? `Use original epochs ${count - 19}-${count - 10} and ${count - 9}-${count}. Training means are ${show(trainingMeans)}. Validation means are ${show(validationMeans)}. Apply the ordered rule to return ${answer}. Exactly 5% is flat. Zero to positive is worsening. This summary does not control the callback or establish why losses changed.`
          : `There are ${count} entries in each curve. Return insufficient-history before calculating ten-epoch means. A short actual training run can be valid.`,
        code: hasWindows
          ? `const previous = values.slice(-20, -10);
const recent = values.slice(-10);
// Original epochs ${count - 19}-${count - 10} and ${count - 9}-${count}. ${answer}`
          : `// ${count} < 20
return 'insufficient-history';`,
      };
    },
  },
  "evaluating-deep-scan": (() => {
    const example = evaluationSpec(false);
    return {
      ...example,
      title: "Trace a case into an error category",
      brief:
        "Select a supplied case. Compare its score with the cutoff, then count the misses and false alarms.",
      boundary:
        "These twelve supplied teaching scores are separate from the coding task's 43 evaluation rows. The constant-0 baseline is a declared comparison rule. This activity does not train or evaluate the exercise model.",
      controls: [
        ...example.controls,
        range("selectedCase", "Case number", 3, 1, 12),
      ],
      cases: cases(
        "Original scores preset",
        "Shifted scores preset",
        "Start with the original supplied scores and cutoff 0.5.",
        "Start with shifted supplied scores and cutoff 0.65.",
        { threshold: 0.5, selectedCase: 3 },
        { threshold: 0.65, selectedCase: 3 },
      ),
      evaluate: (values: Record<string, number>, caseId: string) => {
        const result = example.evaluate(values, caseId);
        const index = (values.selectedCase ?? 3) - 1;
        const item = SCREENING_CASES[index]!;
        const score = changed(caseId)
          ? Math.max(
              0.01,
              Math.min(
                0.99,
                item.score + (item.anomaly ? -0.15 : index % 2 ? 0.1 : 0.03),
              ),
            )
          : item.score;
        const threshold = values.threshold!;
        const predicted = score > threshold ? 1 : 0;
        const label = item.anomaly ? 1 : 0;
        const category = result.graphics[1]!.values[index]!;
        const counts = result.graphics[2]!.values as number[];
        const accuracy = (counts[0]! + counts[3]!) / SCREENING_CASES.length;
        return {
          ...result,
          graphics: [
            { ...result.graphics[0]!, highlight: [index] },
            pipe("Selected case decision", [
              `Case ${index + 1}: supplied label ${label}`,
              `Score ${score} ${score > threshold ? ">" : "≤"} cutoff ${threshold}`,
              `Predict ${predicted}`,
              `${category}: ${category === "FN" ? "missed anomaly" : category === "FP" ? "false alarm" : "matches the label"}`,
            ]),
            result.graphics[1]!,
            result.graphics[2]!,
            bars(
              "Accuracy against a declared constant rule",
              [accuracy, 7 / 12],
              ["Selected cutoff", "Always predict 0"],
              "evaluation-accuracy-fraction",
            ),
          ],
          explanation: `Case ${index + 1} has supplied label ${label}. Its score ${score} ${score > threshold ? "exceeds" : "does not exceed"} ${threshold}, so predict ${predicted}: ${category}. ${result.explanation} Always predicting 0 gets 7 of these 12 cases correct but misses all 5 label-1 cases. That fixed rule was declared before comparing scores.`,
          code: `const selected = { score: ${score}, label: ${label} };
const predicted = selected.score > ${threshold} ? 1 : 0;
const category = predicted === 1
  ? (selected.label === 1 ? 'TP' : 'FP')
  : (selected.label === 1 ? 'FN' : 'TN');
// Case ${index + 1}: ${category}. A score equal to the cutoff predicts 0.`,
        };
      },
    };
  })(),
  "threshold-tuning": ANOMALY_CLARITY["threshold-tuning"]!,
  "time-vs-frequency": SIGNAL_TASK_INVESTIGATIONS["time-vs-frequency"]!,
  "fourier-transform": SIGNAL_TASK_INVESTIGATIONS["fourier-transform"]!,
  spectrograms: SIGNAL_TASK_INVESTIGATIONS.spectrograms!,
  "fft-as-features": SIGNAL_TASK_INVESTIGATIONS["fft-as-features"]!,
  "windowing-and-overlap": SIGNAL_TASK_INVESTIGATIONS["windowing-and-overlap"]!,
  "sequences-matter": RECURRENT_TASK_INVESTIGATIONS["sequences-matter"]!,
  "simple-rnns": RECURRENT_TASK_INVESTIGATIONS["simple-rnns"]!,
  "lstm-gates": {
    title: "One cell update, two results",
    brief:
      "Keep part of the old cell value, add the gated candidate, then check what the output gate passes onward.",
    boundary:
      "The first case uses one dimension from the supplied challenge check: old cell 2, candidate 0, and gates at 0.5. The second changes the candidate to tanh(1). You choose gate fractions directly here. The challenge calculates them from weights. No archive model runs in this activity.",
    controls: [
      range("forget", "Forget gate", 0.5, 0, 1, 0.05),
      range("input", "Input gate", 0.5, 0, 1, 0.05),
      range("output", "Output gate", 0.5, 0, 1, 0.05),
      choice("quantity", "Result to predict", 1, [
        "Cell state",
        "Hidden output",
      ]),
    ],
    cases: cases(
      "Zero candidate",
      "Nonzero candidate",
      "Old cell 2. A zero weighted sum gives tanh(0) = 0 for the candidate.",
      "The old cell stays 2. A candidate weighted sum of 1 gives tanh(1).",
      { forget: 0.5, input: 0.5, output: 0.5 },
      { forget: 0.5, input: 0.5, output: 0.5 },
    ),
    prediction: {
      prompt:
        "What value does the selected cell result have after this update?",
      tolerance: 0.01,
    },
    evaluate: ({ forget, input, output, quantity }, caseId) => {
      const old = 2,
        candidate = Math.tanh(changed(caseId) ? 1 : 0);
      const kept = forget * old,
        added = input * candidate;
      const newCell = kept + added,
        cellOutput = Math.tanh(newCell),
        newHidden = output * cellOutput;
      return {
        graphics: [
          bars(
            "Memory before gating",
            [old, candidate],
            ["Old cell", "Candidate"],
            "cell-memory",
          ),
          bars(
            "Contributions after gating",
            [kept, added],
            ["Retained old memory", "Added candidate"],
            "cell-memory",
          ),
          pipe("Cell update", [
            `Kept ${rounded(kept)}`,
            `Added ${rounded(added)}`,
            `New cell ${rounded(newCell)}`,
          ]),
          pipe("Hidden output", [
            `tanh(new cell) ${rounded(cellOutput)}`,
            `Output gate ${output}`,
            `New hidden ${rounded(newHidden)}`,
          ]),
        ],
        answer: quantity === 0 ? newCell : newHidden,
        answerLabel: quantity === 0 ? "New cell state" : "New hidden output",
        explanation: `The forget gate keeps ${rounded(kept)} and the input gate adds ${rounded(added)}, giving cell state ${rounded(newCell)}. The output gate then gives ${output} × tanh(${rounded(newCell)}) = ${rounded(newHidden)}. Changing only the output gate leaves that cell state unchanged.`,
        code: `const candidate = Math.tanh(${changed(caseId) ? 1 : 0});\nconst newCell = ${forget} * ${old} + ${input} * candidate;\nconst newHidden = ${output} * Math.tanh(newCell);`,
      };
    },
  },
  "sliding-windows": RECURRENT_TASK_INVESTIGATIONS["sliding-windows"]!,
  "sequence-prediction": RECURRENT_TASK_INVESTIGATIONS["sequence-prediction"]!,
  forecasting: TIME_SERIES_CLARITY["forecasting"]!,
  "normal-vs-anomalous": ANOMALY_CLARITY["normal-vs-anomalous"]!,
  autoencoders: ANOMALY_CLARITY["autoencoders"]!,
  "reconstruction-error": ANOMALY_CLARITY["reconstruction-error"]!,
  "the-anomaly": ANOMALY_CLARITY["the-anomaly"]!,
  "beyond-lstm": TIME_SERIES_CLARITY["beyond-lstm"]!,
  "temporal-attention": TIME_SERIES_CLARITY["temporal-attention"]!,
  "kalman-filters": TIME_SERIES_CLARITY["kalman-filters"]!,
  "time-series-ensemble-methods":
    TIME_SERIES_CLARITY["time-series-ensemble-methods"]!,
  quantization: {
    title: "One kernel value becomes a uint8 code",
    brief:
      "Follow a selected weight through this kernel's own min, max, scale, stored code, and decoded float. Then compare the supplied before/after classes.",
    boundary:
      "These are exact small kernels and captures from the quantize-weights checks. Reference class decisions were checked with the shipped solution on TFJS 4.22 CPU. This worksheet runs no model, packs no byte file, and measures no accuracy or runtime.",
    controls: [
      range("position", "Flat kernel index", 3, 0, 3),
      {
        ...range("capture", "Capture index", 1, 0, 4),
        maxFor: (values) => values.captureCount! - 1,
      },
    ],
    cases: [
      {
        id: "standard",
        label: "Stretched kernel",
        description:
          "The 2-by-2 kernel spans -10 to 40, with biases [0, -0.02].",
        values: { captureCount: 5, capture: 1 },
      },
      {
        id: "changed",
        label: "Even kernel",
        description:
          "The 2-by-2 kernel uses only -2 and 2, with biases [0.1, -0.1].",
        values: { captureCount: 4, capture: 1 },
      },
      {
        id: "constant",
        label: "Zero kernel",
        description:
          "A constant zero kernel has scale 0 and decodes without division by zero.",
        values: { captureCount: 1, capture: 0 },
      },
    ],
    prediction: {
      prompt: "What integer code stores the selected kernel value?",
      tolerance: 0,
    },
    evaluate: ({ position, capture }, caseId) => {
      const source =
        QUANTIZATION_CASES[caseId as keyof typeof QUANTIZATION_CASES];
      const kernel = quantizedKernel(source.kernel);
      return {
        graphics: [
          bars("Original weights", kernel.original, undefined, "weights"),
          bars("Decoded kernel weights", kernel.applied, undefined, "weights"),
          pipe("Selected value through storage", [
            `Flat index ${position}: ${kernel.original[position]}`,
            `min ${kernel.min}, max ${kernel.max}`,
            `scale: ${kernel.scale}`,
            `uint8 code: ${kernel.stored[position]}`,
            `Decoded: ${kernel.decoded[position]}`,
          ]),
          cells(
            "Kernel and unchanged biases",
            [
              "Kernel shape: [2, 2]",
              `Biases: [${source.bias.join(", ")}]`,
              `Largest pre-float32 error: ${Math.max(...kernel.error)}`,
              "Codes are arrays here. Byte packing is separate.",
            ],
            2,
          ),
          pipe("Reference prediction comparison", [
            `Capture ${capture}: [${source.captures[capture]!.join(", ")}]`,
            `Before: class ${source.before[capture]}`,
            `After: class ${source.after[capture]}`,
            source.before[capture] === source.after[capture]
              ? "Same predicted class"
              : "Predicted class changed. No trusted label supplied.",
          ]),
        ],
        answer: kernel.stored[position]!,
        answerLabel: "Selected uint8 code",
        explanation: `Use this kernel's bounds, not fixed [-1, 1] bounds. ${kernel.scale === 0 ? "Its values are constant, so scale and every code are zero. Decoding restores min." : `Its scale is (${kernel.max} - ${kernel.min}) / 255. Round the selected offset divided by that scale to get ${kernel.stored[position]}.`} The 1-D biases remain unchanged. ${source.before.filter((value, index) => value !== source.after[index]).length} of ${source.captures.length} supplied class decisions change. Disagreement is not an accuracy verdict.`,
        code: `const value = ${kernel.original[position]};
const min = ${kernel.min};
const scale = ${kernel.scale};
const code = scale === 0 ? 0 : Math.round((value - min) / scale);
const decoded = code * scale + min;`,
      };
    },
  },
  pruning: {
    title: "A pooled cutoff and per-class recall",
    brief:
      "Choose a requested sparsity level. Inspect one weight from the first kernel and the reference recall measured for each class.",
    boundary:
      "This worksheet uses the prune-weights exercise's fixed 11/12/5 classifier and synthetic evaluation slice, 40 cases per class. Its reference recalls were checked with the shipped solution on TFJS 4.22 CPU. It does not rerun a model or reproduce the fictional mission's accuracy table.",
    controls: [
      choice("level", "Requested sparsity", 2, [
        "0%",
        "30%",
        "60%",
        "80%",
        "100%",
      ]),
      range("position", "First-kernel flat index", 4, 0, 11),
      choice("classIndex", "Class to inspect", 4, PRUNING_CLASS_NAMES),
    ],
    cases: [
      {
        id: "standard",
        label: "Sixty-percent preset",
        description:
          "Start at 60% requested sparsity and inspect anomaly recall.",
        values: { level: 2 },
      },
      {
        id: "changed",
        label: "Eighty-percent preset",
        description:
          "Start at 80% requested sparsity, still using the original model weights.",
        values: { level: 3 },
      },
    ],
    prediction: {
      prompt:
        "How many of the selected class's 40 reference cases are classified correctly?",
      tolerance: 0,
    },
    evaluate: ({ level, position, classIndex }) => {
      const ref = pruningReference(level);
      const hits = Math.round(ref.recall[classIndex]! * 40);
      return {
        graphics: [
          bars(
            "Original connections",
            ref.original.slice(0, 12),
            undefined,
            "weights",
          ),
          bars(
            "Connections after magnitude pruning",
            ref.output.slice(0, 12),
            undefined,
            "weights",
          ),
          pipe("One weight under the pooled cutoff", [
            `Rank all ${ref.original.length} kernel values together`,
            `Requested sparsity ${ref.level}`,
            `Cutoff: ${Number.isFinite(ref.cutoff) ? ref.cutoff : "all kernels at 100%"}`,
            `Index ${position}: ${ref.original[position]} becomes ${ref.output[position]}`,
          ]),
          cells(
            "Requested level and measured support",
            [
              `Zero-valued kernel positions after pruning: ${ref.zeros}/${ref.original.length}`,
              "Biases unchanged",
              `${PRUNING_CLASS_NAMES[classIndex]}: ${hits}/40 correct`,
              "No examples for a class would require null recall.",
            ],
            2,
          ),
          bars(
            "Reference recall on the supplied slice",
            ref.recall,
            PRUNING_CLASS_NAMES,
          ),
          pipe("Model lifetime", [
            "Clone original weights",
            "Start every level from originals",
            "Measure class decisions",
            "Restore originals, including after failure",
          ]),
        ],
        answer: hits,
        answerLabel: "Correct selected-class predictions",
        explanation: `The selected class has ${hits} correct decisions out of 40, giving recall ${ref.recall[classIndex]}. Pool both 2-D kernels when choosing the cutoff and keep ties at an interior cutoff. A requested share can differ from the achieved zero fraction. Level zero preserves the original behavior. At full pruning, biases can still select a class. These reference recalls do not identify which weights represent rare patterns.`,
        code: `// Selected reference level from the supplied classifier.
const requested = ${ref.level};
const correct = ${hits};
const support = 40;
const recall = correct / support;
// Each measured level starts from cloned originals. Restore them in finally.`,
      };
    },
  },
};

function evaluationSpec(costs: boolean): LessonInvestigationSpec {
  return {
    title: costs
      ? "Choose a threshold with a cost rule"
      : "Find the mistakes behind accuracy",
    brief: costs
      ? "Change the threshold and the cost of a miss. Compare false alarms with missed anomalies."
      : "Move the decision threshold across labeled scores. Count the anomalies that fall below it.",
    boundary:
      "Twelve labeled teaching cases, separate from the graded exercise and any final test set. The activity supplies the example scores.",
    controls: [
      range("threshold", "Anomaly score threshold", 0.5, 0.1, 0.9, 0.05),
      ...(costs
        ? [range("missCost", "Cost of one missed anomaly", 3, 1, 6)]
        : []),
    ],
    cases: cases(
      "Original labeled scores",
      "Harder labeled scores",
      "Some normal examples have high scores.",
      "Several anomalies receive lower scores.",
      { threshold: 0.5, missCost: 3 },
      { threshold: 0.65, missCost: 4 },
    ),
    prediction: {
      prompt: costs
        ? "What is the total error cost at the current threshold? Each false alarm costs 1. Each miss costs your selected amount."
        : "How many labeled anomalies will this threshold miss?",
      tolerance: 0,
    },
    evaluate: ({ threshold, missCost = 3 }, caseId) => {
      const input = SCREENING_CASES.map((item, i) => ({
        ...item,
        score: changed(caseId)
          ? Math.max(
              0.01,
              Math.min(
                0.99,
                item.score + (item.anomaly ? -0.15 : i % 2 ? 0.1 : 0.03),
              ),
            )
          : item.score,
      }));
      const category = input.map((item) =>
        item.score > threshold
          ? item.anomaly
            ? "TP"
            : "FP"
          : item.anomaly
            ? "FN"
            : "TN",
      );
      const count = (name: string) =>
        category.filter((item) => item === name).length;
      const tp = count("TP"),
        fp = count("FP"),
        fn = count("FN"),
        tn = count("TN");
      return {
        graphics: [
          bars(
            "Scores with reviewed labels",
            input.map((item) => item.score),
            input.map(
              (item, i) => `${i + 1}: ${item.anomaly ? "anomaly" : "normal"}`,
            ),
          ),
          cells(
            "Categories at this threshold",
            category,
            4,
            category.flatMap((item, i) =>
              item === "FN" || item === "FP" ? [i] : [],
            ),
          ),
          bars(
            "Correct predictions, false alarms and misses",
            [tp, fp, fn, tn],
            [
              "True positive",
              "False positive",
              "False negative",
              "True negative",
            ],
          ),
        ],
        answer: costs ? fp + missCost * fn : fn,
        answerLabel: costs ? "Total error cost" : "Missed anomalies",
        explanation: costs
          ? `${fp} false alarms × 1 + ${fn} misses × ${missCost} = ${fp + missCost * fn}. A different cost rule can favor a different threshold.`
          : `With score > ${threshold}, the rule misses ${fn} anomalies and flags ${fp} normal cases. Accuracy is ${rounded(((tp + tn) / input.length) * 100)}%, but it hides these different mistakes.`,
        code: `const predictedAnomaly = score > ${threshold};\n${costs ? `const cost = falsePositives + ${missCost} * falseNegatives;` : "const misses = cases.filter(c => c.anomaly && c.score <= threshold).length;"}`,
      };
    },
  };
}
