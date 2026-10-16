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
  gradientStep,
  kalmanUpdate,
  magnitudeSpectrum,
  quantize,
  softmax,
  teachingSignal,
  trainingTrace,
} from "./instrument-math";

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
): InvestigationGraphic => ({
  kind: "bars",
  label,
  values: values.map(rounded),
  labels,
});
const line = (
  label: string,
  values: number[],
  highlight?: number[],
  labels = values.map((_, index) => String(index)),
): InvestigationGraphic => ({
  kind: "line",
  label,
  values: values.map(rounded),
  highlight,
  labels,
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
const fixed =
  "This calculation uses fixed weights chosen for the example. They are not learned from data.";

export const NUMERIC_INVESTIGATIONS: Record<string, LessonInvestigationSpec> = {
  "introduction-to-tensors": {
    title: "Track a reading into its tensor",
    brief:
      "Pick a position in the packet. Check the value at the same position after creating a tensor.",
    boundary:
      "This diagram follows values into a tensor. The lesson's coding activity creates the actual TensorFlow.js tensor.",
    controls: [range("position", "Reading position (starting at 0)", 2, 0, 4)],
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
    title: "Find a reading after a reshape",
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
      range("position", "Position in the list (count from 0)", 4, 0, 5),
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
      prompt: "Which row will contain the selected number? Count rows from 0.",
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
        explanation: `The number ${input[position]} is now at row ${row}, column ${column}. Reshape fills each row in order and keeps all six numbers. Count rows and columns from 0.`,
        code: `const grid = tf.tensor1d(values).reshape([${6 / columns}, ${columns}]);\n// flat index ${position} becomes [${row}, ${column}]`,
      };
    },
  },
  "tensor-operations": {
    title: "Average two sensor passes",
    brief:
      "Average matching channels from the two passes, then multiply by the gain. Predict the selected output.",
    boundary: teaching,
    controls: [
      range("gain", "Gain after averaging", 2, 0, 3, 0.25),
      range("position", "Output position (starting at 0)", 2, 0, 5),
    ],
    cases: cases(
      "Steady second pass",
      "Changed second pass",
      "Add [4, 8] to each of the three rows before averaging.",
      "Use [8, 4] for every row of a different first pass.",
      { gain: 2, position: 2 },
      { gain: 1, position: 3 },
    ),
    prediction: {
      prompt:
        "What will the selected output value be after averaging and gain?",
      tolerance: 0.01,
    },
    evaluate: ({ gain, position }, caseId) => {
      const input = changed(caseId)
        ? [6, 10, 8, 12, 10, 14]
        : [2, 10, 4, 12, 6, 14];
      const second = changed(caseId) ? [8, 4] : [4, 8];
      const output = input.map(
        (value, index) => ((value + second[index % 2]!) / 2) * gain,
      );
      return {
        graphics: [
          cells("First pass: three rows, two channels", input, 2, [position]),
          cells("Second pass, reused for each row", second, 2, [position % 2]),
          cells("Average, then gain", output, 2, [position]),
        ],
        answer: output[position]!,
        answerLabel: "Selected output",
        explanation: `(${input[position]} + ${second[position % 2]}) ÷ 2 × ${gain} = ${rounded(output[position]!)}. Each channel stays in its column.`,
        code: `const output = pass1.add(tf.tensor1d([${show(second)}])).div(2).mul(${gain});`,
      };
    },
  },
  "data-loading": {
    title: "Build the next batch",
    brief:
      "Choose the number of rows per batch, then a batch to inspect. Keep each row’s three features together.",
    boundary:
      "This example has 16 rows in a fixed order. A real shuffle may arrange them differently.",
    controls: [
      choice(
        "size",
        "Rows per batch",
        4,
        ["2 rows", "4 rows", "8 rows"],
        [2, 4, 8],
      ),
      {
        ...range("batch", "Batch index (starting at 0)", 1, 0, 7),
        maxFor: ({ size }) => 16 / size! - 1,
      },
    ],
    cases: cases(
      "Archive order",
      "Shuffled order",
      "Rows arrive in order from 0 through 15.",
      "A fixed shuffled order lets you trace each row.",
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
            "Archive row IDs",
            order,
            8,
            selected.map((_, index) => batch * size + index),
          ),
          cells(
            "Batch: amplitude, crossings, phase",
            selected.flatMap((id) => [id * 100, id, id / 10]),
            3,
          ),
        ],
        answer: selected[0]!,
        answerLabel: "First row ID in the batch",
        explanation: `Batch ${batch} takes positions ${batch * size} through ${(batch + 1) * size - 1} from this order. Its input shape is [${size}, 3].`,
        code: `const rows = order.slice(${batch * size}, ${(batch + 1) * size});\n// batch shape: [${size}, 3]`,
      };
    },
  },
  normalization: {
    title: "Scale a new sensor row",
    brief:
      "Apply saved training statistics to a new reading. Compare its raw and scaled values.",
    boundary:
      "Statistics come from four fixed training rows. They are reused for the new reading; no statistics are fitted on that reading.",
    controls: [
      range("temperature", "New temperature reading", 24, 18, 30, 0.5),
      choice("method", "Scaling rule", 1, ["Raw values", "Z-score", "Min-max"]),
    ],
    cases: cases(
      "Original calibration",
      "Warmer calibration",
      "Training temperatures are 20, 22, 24, 26.",
      "Training temperatures are 24, 26, 28, 30.",
      { temperature: 24, method: 1 },
      { temperature: 28, method: 2 },
    ),
    prediction: {
      prompt:
        "What is the first feature of the new row after the selected scaling rule?",
      tolerance: 0.015,
    },
    evaluate: ({ temperature, method }, caseId) => {
      const training = NORMALIZATION_ROWS.map(([a, b]) => [
        a! + (changed(caseId) ? 4 : 0),
        b!,
      ]);
      const center = changed(caseId) ? 27 : 23,
        low = center - 3;
      const raw = [temperature, 0.6];
      const output =
        method === 1
          ? [
              (temperature - center) / Math.sqrt(5),
              (0.6 - 0.5) / Math.sqrt(0.05),
            ]
          : method === 2
            ? [(temperature - low) / 6, (0.6 - 0.2) / 0.6]
            : raw;
      return {
        graphics: [
          bars("New row before scaling", raw, ["Temperature", "Signal"]),
          cells("Training rows: temperature, signal", training.flat(), 2),
          bars("New row after scaling", output, ["Temperature", "Signal"]),
        ],
        answer: output[0]!,
        answerLabel: "Scaled temperature",
        explanation:
          method === 0
            ? "Raw features keep their original scales."
            : method === 1
              ? `Subtract the saved mean ${center}, then divide by the saved standard deviation √5. The signal feature uses its own statistics.`
              : `Subtract the saved minimum ${low}, then divide by the saved range 6. A later reading can fall outside [0, 1].`,
        code:
          method === 1
            ? `const scaled = (temperature - ${center}) / Math.sqrt(5);`
            : method === 2
              ? `const scaled = (temperature - ${low}) / 6;`
              : "const scaled = temperature;",
      };
    },
  },
  "first-neuron": {
    title: "Trace one weighted sum",
    brief:
      "Change a weight and bias. Follow each input's contribution into the output.",
    boundary: fixed,
    controls: [
      range("weight", "Weight on input A", 0.75, -2, 2, 0.25),
      range("bias", "Bias", 0.2, -1, 1, 0.1),
    ],
    cases: cases(
      "First input row",
      "Stronger input A",
      "Inputs [0.4, 0.8], with B's weight fixed at -0.5.",
      "Inputs [0.9, 0.3], with the same fixed weight on B.",
      { weight: 0.75, bias: 0.2 },
      { weight: 1, bias: -0.1 },
    ),
    prediction: {
      prompt:
        "What is the neuron's weighted sum plus bias for the current inputs?",
      tolerance: 0.01,
    },
    evaluate: ({ weight, bias }, caseId) => {
      const input = changed(caseId) ? [0.9, 0.3] : [0.4, 0.8];
      const terms = [input[0]! * weight, input[1]! * -0.5, bias];
      const answer = sum(terms);
      return {
        graphics: [
          cells("Two inputs", input),
          bars("Contributions to the sum", terms, [
            "A × weight",
            "B × -0.5",
            "Bias",
          ]),
          pipe("Neuron calculation", [
            `Products [${show(terms.slice(0, 2))}]`,
            `Add bias ${bias}`,
            `Output ${rounded(answer)}`,
          ]),
        ],
        answer,
        answerLabel: "Neuron output",
        explanation: `${rounded(terms[0]!)} + ${rounded(terms[1]!)} + ${bias} = ${rounded(answer)}. This neuron has no activation function yet.`,
        code: `const output = ${input[0]} * ${weight} + ${input[1]} * -0.5 + ${bias};`,
      };
    },
  },
  "activation-functions": {
    title: "Transform a neuron's output",
    brief:
      "Choose an activation and move the weighted sum. Predict the value sent to the next layer.",
    boundary:
      "This evaluates activation formulas directly. It does not run or train a network.",
    controls: [
      range("input", "Weighted sum before activation", -1, -4, 4, 0.25),
      choice("function", "Activation", 0, ["ReLU", "Sigmoid", "Tanh"]),
    ],
    cases: cases(
      "Negative sum",
      "Positive sum",
      "Start with a weighted sum below zero.",
      "Start above zero and compare the three functions.",
      { input: -1, function: 0 },
      { input: 2, function: 1 },
    ),
    prediction: {
      prompt:
        "What value does the selected activation produce at the current weighted sum?",
      tolerance: 0.015,
    },
    evaluate: ({ input, function: fn }) => {
      const activate = (x: number) =>
        fn === 0
          ? Math.max(0, x)
          : fn === 1
            ? 1 / (1 + Math.exp(-x))
            : Math.tanh(x);
      const samples = Array.from({ length: 33 }, (_, i) =>
        activate(-4 + i / 4),
      );
      const answer = activate(input),
        name = ["ReLU", "Sigmoid", "Tanh"][fn]!;
      return {
        graphics: [
          pipe("Input to the activation", [
            `Weighted sum ${input}`,
            `Apply ${name}`,
          ]),
          line(
            `${name} curve from -4 to 4`,
            samples,
            [Math.round((input + 4) * 4)],
            samples.map((_, index) => String(-4 + index / 4)),
          ),
          bars(
            "Before and after activation",
            [input, answer],
            ["Weighted sum", "Activated value"],
          ),
        ],
        answer,
        answerLabel: `${name} output`,
        explanation:
          fn === 0
            ? "ReLU keeps positive values and changes negative values to zero."
            : fn === 1
              ? "Sigmoid maps the sum into a value between 0 and 1."
              : "Tanh maps the sum into a value between -1 and 1.",
        code:
          fn === 0
            ? `const output = Math.max(0, ${input});`
            : fn === 1
              ? `const output = 1 / (1 + Math.exp(-(${input})));`
              : `const output = Math.tanh(${input});`,
      };
    },
  },
  "layers-and-architecture": {
    title: "Count the trainable parameters",
    brief:
      "Change the number of hidden units. Count their connections and one bias per unit.",
    boundary:
      "This counts a dense network's parameters. It does not measure its speed or prediction quality.",
    controls: [range("width", "Hidden units", 3, 1, 8)],
    cases: cases(
      "Two input features",
      "Four input features",
      "Two inputs feed one hidden layer and one output.",
      "Four inputs feed the same kind of network.",
      { width: 3 },
      { width: 4 },
    ),
    prediction: {
      prompt:
        "How many trainable parameters does the whole selected network have, including biases?",
      tolerance: 0,
    },
    evaluate: ({ width }, caseId) => {
      const inputs = changed(caseId) ? 4 : 2;
      const counts = [inputs * width, width, width, 1];
      return {
        graphics: [
          pipe("Layer widths", [
            `${inputs} inputs`,
            `${width} hidden units`,
            "1 output",
          ]),
          bars("Parameter counts", counts, [
            "Input weights",
            "Hidden biases",
            "Output weights",
            "Output bias",
          ]),
        ],
        answer: sum(counts),
        answerLabel: "Total trainable parameters",
        explanation: `The hidden layer has (${inputs} + 1) × ${width} parameters. The output has ${width} weights and one bias. Total: ${sum(counts)}.`,
        code: `const hiddenParams = (${inputs} + 1) * ${width};\nconst outputParams = ${width} + 1;`,
      };
    },
  },
  "forward-pass": {
    title: "Follow an input through two layers",
    brief:
      "Change input A. Apply the hidden layer's weights and ReLU before the output sum.",
    boundary: fixed,
    controls: [range("input", "Input A", 1, -2, 3, 0.25)],
    cases: cases(
      "Positive input B",
      "Negative input B",
      "Input B is 2. Hidden outputs are H1 = ReLU(A - B) and H2 = ReLU(0.5 × A + 0.5 × B). Output = H1 - H2 + 0.2.",
      "Input B is -1. Hidden outputs are H1 = ReLU(A - B) and H2 = ReLU(0.5 × A + 0.5 × B). Output = H1 - H2 + 0.2.",
      { input: 1 },
      { input: 2 },
    ),
    prediction: {
      prompt:
        "What is the final output after the two hidden ReLU units and output sum?",
      tolerance: 0.01,
    },
    evaluate: ({ input }, caseId) => {
      const b = changed(caseId) ? -1 : 2;
      const pre = [input - b, 0.5 * input + 0.5 * b];
      const hidden = pre.map((value) => Math.max(0, value));
      const answer = hidden[0]! - hidden[1]! + 0.2;
      return {
        graphics: [
          cells("Input row", [input, b]),
          bars(
            "Hidden layer before and after ReLU",
            [...pre, ...hidden],
            ["Sum H1", "Sum H2", "ReLU H1", "ReLU H2"],
          ),
          pipe("Forward calculation", [
            `Input [${input}, ${b}]`,
            `Hidden [${show(hidden)}]`,
            `Output ${rounded(answer)} = H1 - H2 + 0.2`,
          ]),
        ],
        answer,
        answerLabel: "Final output",
        explanation: `Hidden outputs are ${show(hidden)}. The output layer computes ${rounded(hidden[0]!)} - ${rounded(hidden[1]!)} + 0.2 = ${rounded(answer)}. Weights stay fixed.`,
        code: `const h1 = Math.max(0, ${input} - ${b});\nconst h2 = Math.max(0, 0.5 * ${input} + 0.5 * ${b});\nconst output = h1 - h2 + 0.2;`,
      };
    },
  },
  "building-a-network": {
    title: "Connect the next dense layer",
    brief:
      "Change the number of hidden and output units. Work out the shape of the output layer’s weights.",
    boundary:
      "This checks dense-layer shapes and counts. The diagram does not construct or train a model.",
    controls: [
      range("width", "Hidden units", 4, 1, 8),
      choice(
        "outputs",
        "Output units",
        1,
        ["1 output", "2 outputs", "3 outputs"],
        [1, 2, 3],
      ),
    ],
    cases: cases(
      "Batch of four",
      "Batch of eight",
      "Four examples each have three input features.",
      "Eight examples each have five input features.",
      { width: 4, outputs: 1 },
      { width: 3, outputs: 2 },
    ),
    prediction: {
      prompt:
        "How many weights does the output layer need, excluding its biases?",
      tolerance: 0,
    },
    evaluate: ({ width, outputs }, caseId) => {
      const batch = changed(caseId) ? 8 : 4,
        inputs = changed(caseId) ? 5 : 3;
      return {
        graphics: [
          pipe("Shapes across the network", [
            `Input [${batch}, ${inputs}]`,
            `Hidden [${batch}, ${width}]`,
            `Output [${batch}, ${outputs}]`,
          ]),
          cells(
            `Output weight matrix [${width}, ${outputs}]`,
            Array.from(
              { length: width * outputs },
              (_, i) => `w${Math.floor(i / outputs)},${i % outputs}`,
            ),
            outputs,
          ),
        ],
        answer: width * outputs,
        answerLabel: "Output-layer weight count",
        explanation: `Each of ${outputs} outputs connects to all ${width} hidden units. Its weights have shape [${width}, ${outputs}]. Batch size changes how many outputs are calculated, not how many weights the layer has.`,
        code: `model.add(tf.layers.dense({ units: ${width}, inputShape: [${inputs}], activation: 'relu' }));\nmodel.add(tf.layers.dense({ units: ${outputs} }));`,
      };
    },
  },
  "loss-functions": {
    title: "Measure prediction error",
    brief:
      "Move one prediction. Square each difference, then average the three errors.",
    boundary:
      "Three fixed targets and editable predictions. This calculates loss without fitting a model.",
    controls: [
      range("prediction", "Prediction for the middle example", 4, 0, 8, 0.5),
    ],
    cases: cases(
      "Targets 2, 4, 6",
      "Targets 1, 3, 5",
      "The first and last predictions are 2 and 7.",
      "The first and last predictions are 0 and 6.",
      { prediction: 4 },
      { prediction: 5 },
    ),
    prediction: {
      prompt:
        "What is the mean squared error across all three current predictions?",
      tolerance: 0.015,
    },
    evaluate: ({ prediction }, caseId) => {
      const target = changed(caseId) ? [1, 3, 5] : [2, 4, 6];
      const predicted = changed(caseId)
        ? [0, prediction, 6]
        : [2, prediction, 7];
      const errors = predicted.map((value, i) => (value - target[i]!) ** 2);
      return {
        graphics: [
          bars("Targets", target, ["Example A", "Example B", "Example C"]),
          bars("Predictions", predicted, [
            "Example A",
            "Example B",
            "Example C",
          ]),
          bars("Squared errors", errors, [
            "Example A",
            "Example B",
            "Example C",
          ]),
        ],
        answer: mean(errors),
        answerLabel: "Mean squared error",
        explanation: `Squared errors are ${show(errors)}. Their sum ${sum(errors)} divided by 3 gives MSE ${rounded(mean(errors))}.`,
        code: "const mse = predictions.reduce((total, value, i) => total + (value - targets[i]) ** 2, 0) / 3;",
      };
    },
  },
  "gradient-descent": {
    title: "Predict the next weight update",
    brief:
      "Choose a starting weight and learning rate on the loss curve (w - 3)².",
    boundary:
      "This takes one gradient step on a simple curved loss function. Real models usually have many weights that affect each other.",
    controls: [
      range("weight", "Current weight", 0, -1, 7, 0.5),
      range("rate", "Learning rate", 0.2, 0.05, 1.2, 0.05),
    ],
    cases: cases(
      "Start below the minimum",
      "Start above the minimum",
      "The minimum is at w = 3.",
      "Start on the other side of the same curve with a larger rate.",
      { weight: 0, rate: 0.2 },
      { weight: 6, rate: 0.75 },
    ),
    prediction: {
      prompt:
        "What will the weight be after one gradient-descent update with the current learning rate?",
      tolerance: 0.015,
    },
    evaluate: ({ weight, rate }) => {
      const gradient = 2 * (weight - 3),
        next = gradientStep(weight, rate);
      return {
        graphics: [
          line(
            "Loss (w - 3)² for weights -1 to 7",
            Array.from({ length: 17 }, (_, i) => (-1 + i / 2 - 3) ** 2),
            [Math.round((weight + 1) * 2)],
            Array.from({ length: 17 }, (_, i) => String(-1 + i / 2)),
          ),
          bars(
            "Loss before and after the step",
            [(weight - 3) ** 2, (next - 3) ** 2],
            ["Before", "After"],
          ),
          pipe("Weight update", [
            `Current ${weight}`,
            `Subtract ${rounded(rate * gradient)}`,
            `Next weight ${rounded(next)}`,
          ]),
        ],
        answer: next,
        answerLabel: "Next weight",
        explanation: `Gradient = 2 × (${weight} - 3) = ${gradient}. Next weight = ${weight} - ${rate} × ${gradient} = ${rounded(next)}. The loss ${(next - 3) ** 2 > (weight - 3) ** 2 ? "increases" : "does not increase"} in this step.`,
        code: `const nextWeight = ${weight} - ${rate} * (2 * (${weight} - 3));`,
      };
    },
  },
  backpropagation: {
    title: "Trace the gradient through a product",
    brief:
      "Change the weight. Follow y = w × x into squared loss and back to the weight.",
    boundary:
      "This calculates the derivative of one numeric output. A network’s backpropagation combines many such steps.",
    controls: [range("weight", "Weight w", 0.5, -1, 3, 0.25)],
    cases: cases(
      "Input 2, target 3",
      "Input 3, target 1",
      "The input and target stay fixed while you change w.",
      "A different input and target change both the error and local derivative.",
      { weight: 0.5 },
      { weight: 1 },
    ),
    prediction: {
      prompt:
        "What is the derivative of squared loss with respect to the current weight?",
      tolerance: 0.01,
    },
    evaluate: ({ weight }, caseId) => {
      const x = changed(caseId) ? 3 : 2,
        target = changed(caseId) ? 1 : 3;
      const y = weight * x,
        dLoss = 2 * (y - target),
        gradient = dLoss * x;
      return {
        graphics: [
          pipe("Forward calculation", [
            `x = ${x}`,
            `w × x = ${rounded(y)}`,
            `Target = ${target}`,
          ]),
          bars(
            "Local derivatives and final gradient",
            [dLoss, x, gradient],
            ["dL/dy", "dy/dw", "dL/dw"],
          ),
        ],
        answer: gradient,
        answerLabel: "Gradient dL/dw",
        explanation: `The chain rule multiplies dL/dy = ${dLoss} by dy/dw = ${x}. The weight gradient is ${gradient}.`,
        code: `const prediction = ${weight} * ${x};\nconst gradient = 2 * (prediction - ${target}) * ${x};`,
      };
    },
  },
  "training-loop": {
    title: "Choose the checkpoint to keep",
    brief:
      "Choose how many epochs to inspect. Compare the latest validation loss with the lowest one seen so far.",
    boundary:
      "These curves are illustrative, not measurements. TFJS early stopping keeps the final weights. To use the best observed checkpoint, save its weights during training and restore them yourself.",
    controls: [range("epoch", "Last observed epoch", 16, 1, 24)],
    cases: cases(
      "Late overfitting",
      "Earlier overfitting",
      "Validation starts worsening later in the run.",
      "Validation starts worsening sooner.",
      { epoch: 16 },
      { epoch: 12 },
    ),
    prediction: {
      prompt:
        "Which observed epoch has the lowest validation loss? Count epochs starting at 0.",
      tolerance: 0,
    },
    evaluate: ({ epoch }, caseId) => {
      const trace = trainingTrace.slice(0, epoch + 1).map((item) => ({
        ...item,
        validation: changed(caseId)
          ? 0.66 * Math.exp(-item.epoch / 4) +
            0.13 +
            Math.max(0, item.epoch - 7) ** 2 * 0.005
          : item.validation,
      }));
      const best = trace.reduce((a, b) =>
        b.validation < a.validation ? b : a,
      );
      return {
        graphics: [
          line(
            "Observed validation loss by epoch",
            trace.map((item) => item.validation),
            [epoch],
            trace.map((item) => String(item.epoch)),
          ),
          line(
            "Training loss by epoch",
            trace.map((item) => item.train),
            [epoch],
            trace.map((item) => String(item.epoch)),
          ),
          pipe("Checkpoint comparison", [
            `Latest epoch ${epoch}: validation ${rounded(trace[epoch]!.validation)}`,
            `Best epoch ${best.epoch}: validation ${rounded(best.validation)}`,
            `Keep checkpoint ${best.epoch}`,
          ]),
        ],
        answer: best.epoch,
        answerLabel: "Best validation checkpoint",
        explanation: `Epoch ${best.epoch} has the lowest observed validation loss, ${rounded(best.validation)}. The latest epoch ${epoch} has ${rounded(trace[epoch]!.validation)}. TFJS early stopping does not restore epoch ${best.epoch}. Save a copy of the best weights during training, then restore it after the run.`,
        code: "const best = history.reduce((a, b) => b.validation < a.validation ? b : a);",
      };
    },
  },
  "evaluating-deep-scan": evaluationSpec(false),
  "threshold-tuning": evaluationSpec(true),
  "time-vs-frequency": signalSpec("views"),
  "fourier-transform": signalSpec("fourier"),
  spectrograms: signalSpec("spectrogram"),
  "fft-as-features": signalSpec("features"),
  "windowing-and-overlap": signalSpec("window"),
  "sequences-matter": {
    title: "Read the direction of a sequence",
    brief:
      "Reverse the readings or keep their order. Compare the first and last values.",
    boundary:
      "These are two short example sequences. Comparing the first and last values shows their overall change, not its cause.",
    controls: [
      choice("reverse", "Sequence order", 0, ["Original", "Reversed"]),
    ],
    cases: cases(
      "Rising capture",
      "Falling capture",
      "Eight readings with an overall rise.",
      "Eight different readings with an overall fall.",
      { reverse: 0 },
      { reverse: 1 },
    ),
    prediction: {
      prompt:
        "What is the last reading minus the first reading in the current order?",
      tolerance: 0,
    },
    evaluate: ({ reverse }, caseId) => {
      const original = changed(caseId)
        ? [12, 10, 11, 8, 9, 6, 7, 4]
        : [2, 4, 3, 6, 5, 8, 7, 9];
      const values = reverse ? [...original].reverse() : original;
      const differences = values.slice(1).map((value, i) => value - values[i]!);
      const answer = values.at(-1)! - values[0]!;
      return {
        graphics: [
          line(
            "Readings in current time order",
            values,
            undefined,
            values.map((_, i) => `t${i}`),
          ),
          bars(
            "Change from each previous reading",
            differences,
            differences.map((_, i) => `t${i} → t${i + 1}`),
          ),
        ],
        answer,
        answerLabel: "Last reading minus first",
        explanation: `Last ${values.at(-1)} minus first ${values[0]} is ${answer}. Reversing the order keeps the values but reverses the direction of the changes.`,
        code: `const change = values.at(-1) - values[0];\n// ${values.at(-1)} - ${values[0]}`,
      };
    },
  },
  "simple-rnns": {
    title: "Update a recurrent state",
    brief:
      "Select a time step and change how much previous state contributes. Start the state at zero.",
    boundary:
      "This recurrent unit carries one number as state. Its input weight is fixed at 0.5; you choose the state weight. No training happens here.",
    controls: [
      range("step", "Time step (starting at 0)", 3, 0, 5),
      range("memory", "Weight on previous state", 0.7, 0, 1.2, 0.1),
    ],
    cases: cases(
      "Gradual readings",
      "A brief spike",
      "Inputs rise over six time steps.",
      "A large early value is followed by smaller readings.",
      { step: 3, memory: 0.7 },
      { step: 4, memory: 0.9 },
    ),
    prediction: {
      prompt:
        "What is the recurrent state after the selected time step? Use tanh(0.5 × input/10 + state weight × previous state).",
      tolerance: 0.02,
    },
    evaluate: ({ step, memory }, caseId) => {
      const input = changed(caseId) ? [2, 9, 2, 3, 2, 3] : [2, 4, 3, 6, 5, 8];
      const states: number[] = [];
      input.forEach((value, i) =>
        states.push(
          Math.tanh((0.5 * value) / 10 + memory * (states[i - 1] ?? 0)),
        ),
      );
      return {
        graphics: [
          line(
            "Input readings over time",
            input,
            [step],
            input.map((_, i) => `t${i}`),
          ),
          line(
            "State after each reading",
            states,
            [step],
            states.map((_, i) => `t${i}`),
          ),
          pipe("Selected update", [
            `Input ${input[step]} ÷ 10`,
            `Previous state ${rounded(states[step - 1] ?? 0)}`,
            `Next state ${rounded(states[step]!)}`,
          ]),
        ],
        answer: states[step]!,
        answerLabel: `State at t${step}`,
        explanation: `At t${step}, the input contribution is ${rounded((0.5 * input[step]!) / 10)} and the previous-state contribution is ${rounded(memory * (states[step - 1] ?? 0))}. Tanh produces ${rounded(states[step]!)}.`,
        code: `const nextState = Math.tanh(0.5 * ${input[step]} / 10 + ${memory} * ${states[step - 1] ?? 0});`,
      };
    },
  },
  "lstm-gates": {
    title: "Keep and replace cell memory",
    brief:
      "Adjust the forget and input gates. Add the kept part of the old value to the allowed part of the candidate.",
    boundary:
      "This updates one stored LSTM value using gate values you choose. A full LSTM learns gates for many stored values and also has an output gate.",
    controls: [
      range("forget", "Forget gate", 0.75, 0, 1, 0.05),
      range("input", "Input gate", 0.4, 0, 1, 0.05),
    ],
    cases: cases(
      "Small negative candidate",
      "Positive replacement",
      "Old cell 0.8, new candidate -0.2.",
      "Old cell -0.6, new candidate 0.9.",
      { forget: 0.75, input: 0.4 },
      { forget: 0.25, input: 0.8 },
    ),
    prediction: {
      prompt: "What is the new cell memory with the current gate values?",
      tolerance: 0.01,
    },
    evaluate: ({ forget, input }, caseId) => {
      const old = changed(caseId) ? -0.6 : 0.8,
        candidate = changed(caseId) ? 0.9 : -0.2;
      const kept = forget * old,
        added = input * candidate;
      return {
        graphics: [
          bars(
            "Memory before gating",
            [old, candidate],
            ["Old cell", "Candidate"],
          ),
          bars(
            "Contributions after gating",
            [kept, added],
            ["Retained old memory", "Added candidate"],
          ),
          pipe("Cell update", [
            `Forget gate ${forget}`,
            `Input gate ${input}`,
            `New cell ${rounded(kept + added)}`,
          ]),
        ],
        answer: kept + added,
        answerLabel: "New cell memory",
        explanation: `${forget} × ${old} + ${input} × ${candidate} = ${rounded(kept + added)}. Each gate scales its own contribution before the sum.`,
        code: `const nextCell = ${forget} * ${old} + ${input} * ${candidate};`,
      };
    },
  },
  "sliding-windows": {
    title: "Separate an input window from its target",
    brief:
      "Move the input window and change its length. The following reading is the target.",
    boundary:
      "This is a short example in time order. For training and validation, split the original stream by time before making windows.",
    controls: [
      choice(
        "length",
        "Input window length",
        3,
        ["2 readings", "3 readings", "4 readings"],
        [2, 3, 4],
      ),
      {
        ...range("start", "Window start (starting at 0)", 1, 0, 5),
        maxFor: ({ length }) => 8 - length! - 1,
      },
    ],
    cases: cases(
      "First capture",
      "Second capture",
      "Readings [2, 4, 3, 6, 5, 8, 7, 9].",
      "Readings [9, 7, 8, 6, 4, 5, 3, 2].",
      { start: 1, length: 3 },
      { start: 2, length: 2 },
    ),
    prediction: {
      prompt:
        "Which reading is the target immediately after the current input window?",
      tolerance: 0,
    },
    evaluate: ({ start, length }, caseId) => {
      const values = changed(caseId)
        ? [9, 7, 8, 6, 4, 5, 3, 2]
        : [2, 4, 3, 6, 5, 8, 7, 9];
      const targetIndex = start + length,
        input = values.slice(start, targetIndex);
      return {
        graphics: [
          line(
            "Complete time sequence",
            values,
            undefined,
            values.map((_, i) => `t${i}`),
          ),
          cells(`Input readings t${start} through t${targetIndex - 1}`, input),
          pipe("Input and target positions", [
            `Start t${start}`,
            `${length} input readings`,
            `Target at t${targetIndex}: ${values[targetIndex]}`,
          ]),
        ],
        answer: values[targetIndex]!,
        answerLabel: `Target at t${targetIndex}`,
        explanation: `Input [${show(input)}] ends at t${targetIndex - 1}. The next reading, ${values[targetIndex]}, is the target and stays outside the input.`,
        code: `const input = series.slice(${start}, ${targetIndex});\nconst target = series[${targetIndex}];`,
      };
    },
  },
  "sequence-prediction": forecastSpec(false),
  forecasting: forecastSpec(true),
  "normal-vs-anomalous": {
    title: "Compare a reading with its baseline",
    brief:
      "Move a candidate reading. Measure its distance in the baseline's standard deviations.",
    boundary:
      "Five example readings form the reference baseline. Being far from them does not by itself prove that a new reading is anomalous.",
    controls: [range("reading", "Candidate reading", 13, 4, 20, 0.5)],
    cases: cases(
      "Baseline near 10",
      "Baseline near 14",
      "Reference readings are 8, 9, 10, 11, 12.",
      "A different operating condition has readings 12, 13, 14, 15, 16.",
      { reading: 13 },
      { reading: 13 },
    ),
    prediction: {
      prompt:
        "How many baseline standard deviations is the current reading from the reference mean?",
      tolerance: 0.02,
    },
    evaluate: ({ reading }, caseId) => {
      const center = changed(caseId) ? 14 : 10,
        reference = [-2, -1, 0, 1, 2].map((offset) => center + offset);
      const distance = Math.abs(reading - center),
        answer = distance / Math.sqrt(2);
      return {
        graphics: [
          cells("Reference readings", reference),
          bars(
            "Mean and candidate",
            [center, reading],
            ["Reference mean", "Candidate"],
          ),
          bars(
            "Distance measures",
            [distance, answer],
            ["Raw distance", "Standard deviations"],
          ),
        ],
        answer,
        answerLabel: "Standardized distance",
        explanation: `The reference mean is ${center}, with population standard deviation √2. |${reading} - ${center}| ÷ √2 = ${rounded(answer)}. Review the operating context before assigning a label.`,
        code: `const distance = Math.abs(${reading} - ${center}) / Math.sqrt(2);`,
      };
    },
  },
  autoencoders: reconstructionSpec(false),
  "reconstruction-error": reconstructionSpec(true),
  "the-anomaly": {
    title: "Combine three detector votes",
    brief:
      "Change the amplitude, reconstruction error and forecast. Count the votes, then apply the two-out-of-three alert rule.",
    boundary:
      "The baseline and supplied detector outputs are synthetic practice inputs. No autoencoder or LSTM runs here. The statistical vote uses amplitude; reconstruction error has cutoff 1; forecast error has cutoff 0.1 amplitude units. Votes share data and can fail together. They are not independent proofs or a probability.",
    controls: [
      range("actual", "Actual amplitude", 0.5, 0, 1, 0.01),
      range(
        "reconstructionError",
        "Supplied autoencoder reconstruction error",
        6.2,
        0,
        7,
        0.1,
      ),
      range("predicted", "Supplied LSTM amplitude forecast", 0.2, 0, 1, 0.01),
    ],
    cases: cases(
      "Story replay",
      "Ordinary reading",
      "Amplitude 0.50, reconstruction error 6.2 and forecast 0.20. Compare against the displayed calm baseline.",
      "Amplitude 0.52, reconstruction error 0.1 and forecast 0.53. The same baseline and cutoffs apply.",
      { actual: 0.5, reconstructionError: 6.2, predicted: 0.2 },
      { actual: 0.52, reconstructionError: 0.1, predicted: 0.53 },
    ),
    prediction: {
      prompt: "How many detectors vote for an alert with these inputs?",
      tolerance: 0,
    },
    evaluate: ({ actual, reconstructionError, predicted }) => {
      const baseline = [0.5, 0.54, 0.51, 0.53, 0.52, 0.52, 0.5, 0.54];
      const center = mean(baseline);
      const spread = Math.sqrt(
        mean(baseline.map((value) => (value - center) ** 2)),
      );
      const z = Math.abs(actual - center) / spread;
      const forecastError = Math.abs(predicted - actual);
      const flags = [z > 3, reconstructionError > 1, forecastError > 0.1];
      const votes = flags.filter(Boolean).length;
      return {
        graphics: [
          cells(
            "Supplied detector inputs",
            [
              `Calm amplitudes: ${show(baseline)}`,
              `Baseline mean: ${rounded(center)}`,
              `Population standard deviation: ${rounded(spread)}`,
              `Actual amplitude: ${actual}`,
              `Reconstruction error: ${reconstructionError}; cutoff 1`,
              `Forecast: ${predicted}; allowed amplitude error 0.1`,
            ],
            2,
          ),
          bars(
            "Each score divided by its own cutoff (a vote requires > 1)",
            [z / 3, reconstructionError, forecastError / 0.1],
            ["Statistical", "Autoencoder", "LSTM"],
          ),
          cells(
            "Detector votes",
            [
              `Statistical |z| > 3: ${flags[0] ? "vote" : "no vote"}`,
              `Autoencoder error > 1: ${flags[1] ? "vote" : "no vote"}`,
              `LSTM amplitude error > 0.1: ${flags[2] ? "vote" : "no vote"}`,
            ],
            1,
            flags.flatMap((flag, i) => (flag ? [i] : [])),
          ),
          pipe("Majority decision", [
            `${votes} of 3 detector thresholds crossed`,
            votes >= 2 ? "Alert selected" : "No alert selected",
          ]),
        ],
        answer: votes,
        answerLabel: "Detector votes",
        explanation: `The amplitude is ${rounded(z)} standard deviations from the calm mean. Reconstruction error is ${reconstructionError}; the forecast misses by ${rounded(forecastError)} amplitude units. ${votes} of three detectors vote, so the majority rule ${votes >= 2 ? "selects an alert" : "does not select an alert"}. The supplied error and forecast are not recomputed when amplitude changes. This exercise's amplitude-error gate differs from the full model's three-feature forecast MSE.`,
        code: `const votes = [Math.abs((actual - mean) / std) > 3, reconstructionError > 1, Math.abs(predicted - actual) > 0.1].filter(Boolean).length;\nconst alert = votes >= 2;`,
      };
    },
  },
  "beyond-lstm": attentionSpec(false),
  "temporal-attention": attentionSpec(true),
  "kalman-filters": {
    title: "Balance prediction and measurement",
    brief:
      "Change measurement noise. Calculate how far a new measurement moves the estimate.",
    boundary:
      "This updates one estimated value using a fixed prediction and its variance. It is one Kalman measurement step, not a full system simulation.",
    controls: [
      range("noise", "Measurement variance R", 4, 0.5, 16, 0.5),
      range("measurement", "New measurement", 14, 4, 20, 0.5),
    ],
    cases: cases(
      "Prediction 10",
      "Prediction 14",
      "Predicted value 10, predicted variance P = 4.",
      "Predicted value 14, predicted variance P = 1.",
      { noise: 4, measurement: 14 },
      { noise: 8, measurement: 10 },
    ),
    prediction: {
      prompt:
        "What is the updated estimate after combining the current prediction and measurement?",
      tolerance: 0.02,
    },
    evaluate: ({ noise, measurement }, caseId) => {
      const prediction = changed(caseId) ? 14 : 10,
        variance = changed(caseId) ? 1 : 4;
      const result = kalmanUpdate(prediction, measurement, variance, noise);
      return {
        graphics: [
          bars(
            "Prediction and new measurement",
            [prediction, measurement],
            ["Prediction", "Measurement"],
          ),
          bars(
            "Uncertainty and gain",
            [variance, noise, result.gain],
            ["Predicted variance P", "Measurement variance R", "Gain K"],
          ),
          bars(
            "Estimate after the measurement update",
            [prediction, result.estimate, measurement],
            ["Prior prediction", "Updated estimate", "Measurement"],
          ),
        ],
        answer: result.estimate,
        answerLabel: "Updated estimate",
        explanation: `Gain K = ${variance} ÷ (${variance} + ${noise}) = ${rounded(result.gain)}. The estimate moves ${rounded(result.gain * (measurement - prediction))} from the prediction toward the measurement.`,
        code: `const gain = ${variance} / (${variance} + ${noise});\nconst estimate = ${prediction} + gain * (${measurement} - ${prediction});`,
      };
    },
  },
  "time-series-ensemble-methods": {
    title: "Blend two forecasts",
    brief:
      "Change the weight on forecast A. Compare the combined forecast with later observations.",
    boundary:
      "Two fixed forecasts on four teaching observations. A good weight here may not work on future data.",
    controls: [range("blend", "Weight on forecast A", 0.5, 0, 1, 0.05)],
    cases: cases(
      "Different forecast errors",
      "Shared forecast errors",
      "A tends high while B tends lower.",
      "Both forecasts miss upward in the same direction.",
      { blend: 0.5 },
      { blend: 0.25 },
    ),
    prediction: {
      prompt:
        "What is the mean absolute error of the current combined forecast across all four observations?",
      tolerance: 0.015,
    },
    evaluate: ({ blend }, caseId) => {
      const a = changed(caseId) ? [10, 11, 13, 15] : [8, 9, 11, 13];
      const b = changed(caseId) ? [9, 10, 12, 14] : [9, 10, 10, 11];
      const actual = [8.4, 9.2, 10.5, 11.8];
      const combined = a.map((value, i) => blend * value + (1 - blend) * b[i]!);
      const errors = combined.map((value, i) => Math.abs(value - actual[i]!));
      return {
        graphics: [
          bars(
            "Forecasts and later observations at each horizon",
            a.flatMap((value, i) => [value, b[i]!, actual[i]!]),
            a.flatMap((_, i) => [
              `A h${i + 1}`,
              `B h${i + 1}`,
              `Observed h${i + 1}`,
            ]),
          ),
          line(
            "Combined forecast",
            combined,
            undefined,
            combined.map((_, i) => `h${i + 1}`),
          ),
          bars(
            "Absolute error against later observations",
            errors,
            actual.map((value, i) => `h${i + 1}: observed ${value}`),
          ),
        ],
        answer: mean(errors),
        answerLabel: "Ensemble mean absolute error",
        explanation: `A receives weight ${blend}; B receives ${rounded(1 - blend)}. Mean absolute error is ${rounded(mean(errors))}. Shared forecast errors remain after averaging.`,
        code: `const combined = a.map((value, i) => ${blend} * value + ${rounded(1 - blend)} * b[i]);`,
      };
    },
  },
  quantization: {
    title: "Round a weight to fewer levels",
    brief:
      "Choose the bits per weight and a weight to inspect. Compare its original and rounded values.",
    boundary:
      "Uniform quantization over [-1, 1] with fixed bounds. It demonstrates rounding, not a measured runtime or accuracy improvement.",
    controls: [
      choice(
        "bits",
        "Bits per weight",
        3,
        ["2 bits", "3 bits", "4 bits", "8 bits"],
        [2, 3, 4, 8],
      ),
      range("position", "Weight position (starting at 0)", 4, 0, 5),
    ],
    cases: cases(
      "Mixed weights",
      "Weights near zero",
      "Weights span most of the allowed range.",
      "Smaller weights make coarse rounding easier to see.",
      { bits: 3, position: 4 },
      { bits: 2, position: 2 },
    ),
    prediction: {
      prompt:
        "What is the selected weight after rounding to the current bit depth?",
      tolerance: 0.015,
    },
    evaluate: ({ bits, position }, caseId) => {
      const original = changed(caseId)
        ? [-0.4, -0.18, -0.02, 0.05, 0.22, 0.38]
        : [-0.83, -0.31, -0.07, 0.14, 0.46, 0.91];
      const output = quantize(original, bits),
        errors = output.map((value, i) => Math.abs(value - original[i]!));
      return {
        graphics: [
          bars("Original weights", original),
          bars(`Rounded weights, ${2 ** bits} levels`, output),
          bars("Absolute rounding error", errors),
        ],
        answer: output[position]!,
        answerLabel: `Rounded weight at position ${position}`,
        explanation: `Weight ${original[position]} rounds to ${rounded(output[position]!)} with ${2 ** bits} levels. Its absolute error is ${rounded(errors[position]!)}. Storage for six values is ${6 * bits} bits before metadata.`,
        code: `const levels = 2 ** ${bits} - 1;\nconst roundedWeight = Math.round((weight + 1) / 2 * levels) / levels * 2 - 1;`,
      };
    },
  },
  pruning: {
    title: "Remove weights below a cutoff",
    brief: "Raise the magnitude cutoff. Count the weights that remain nonzero.",
    boundary:
      "This sets small weights to zero in a six-weight example. Test prediction quality afterward. Zeros save processing work only if the runtime can skip them.",
    controls: [range("cutoff", "Magnitude cutoff", 0.2, 0, 1, 0.05)],
    cases: cases(
      "Spread-out weights",
      "Mostly small weights",
      "Six weights have varied magnitudes.",
      "A different set contains more small weights.",
      { cutoff: 0.2 },
      { cutoff: 0.3 },
    ),
    prediction: {
      prompt:
        "How many weights remain nonzero after applying the current cutoff? Weights exactly at the cutoff are kept.",
      tolerance: 0,
    },
    evaluate: ({ cutoff }, caseId) => {
      const original = changed(caseId)
        ? [-0.52, -0.18, -0.04, 0.08, 0.21, 0.63]
        : [-0.83, -0.31, -0.07, 0.14, 0.46, 0.91];
      const output = original.map((value) =>
        Math.abs(value) < cutoff ? 0 : value,
      );
      const count = output.filter((value) => value !== 0).length;
      return {
        graphics: [
          bars("Original connections", original),
          bars("Connections after magnitude pruning", output),
          cells(
            "Connection status",
            output.map((value) => (value === 0 ? "Removed" : "Kept")),
            3,
            output.flatMap((value, i) => (value === 0 ? [] : [i])),
          ),
        ],
        answer: count,
        answerLabel: "Remaining nonzero weights",
        explanation: `${6 - count} weights have magnitude below ${cutoff} and become zero. ${count} remain. Check the model's predictions before deciding whether these connections can be removed.`,
        code: `const pruned = weights.map(weight => Math.abs(weight) < ${cutoff} ? 0 : weight);`,
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
      "Twelve labeled teaching cases, separate from the graded exercise and any final test set. The scores are fixed fixtures.",
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
        ? "What is the total error cost at the current threshold? Each false alarm costs 1; each miss costs your selected amount."
        : "How many labeled anomalies will be missed at the current threshold?",
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
          : `At score > ${threshold}, ${fn} anomalies are missed and ${fp} normal cases raise false alarms. Accuracy is ${rounded(((tp + tn) / input.length) * 100)}%, but it hides these different mistakes.`,
        code: `const predictedAnomaly = score > ${threshold};\n${costs ? `const cost = falsePositives + ${missCost} * falseNegatives;` : "const misses = cases.filter(c => c.anomaly && c.score <= threshold).length;"}`,
      };
    },
  };
}

function signalSpec(
  mode: "views" | "fourier" | "spectrogram" | "features" | "window",
): LessonInvestigationSpec {
  const windowed = mode === "window",
    timed = mode === "spectrogram";
  const controls = windowed
    ? [
        range("frequency", "Tone frequency in Hz", 10.5, 8, 12, 0.25),
        choice("taper", "Window function", 0, ["Rectangular", "Hann"]),
      ]
    : timed
      ? [
          range("start", "Window start sample", 0, 0, 96, 16),
          range("frequency", "New tone frequency in Hz", 12, 6, 20, 2),
        ]
      : [
          range("frequency", "Second tone frequency in Hz", 12, 6, 20),
          range("amplitude", "Second tone amplitude", 0.6, 0.1, 1.5, 0.1),
        ];
  const title = {
    views: "Connect a waveform to its tones",
    fourier: "Move a spectral peak",
    spectrogram: "Locate a tone in time",
    features: "Extract one frequency feature",
    window: "Inspect leakage between bins",
  }[mode];
  const prompt =
    mode === "views" || mode === "fourier"
      ? "Which integer frequency bin should contain the second tone's largest peak? The sample rate is 64 Hz and the window has 64 samples."
      : timed
        ? "How many samples in the current 64-sample window include the new tone? It starts at the onset sample shown in the capture."
        : mode === "features"
          ? "What magnitude will the fixed 12 Hz feature bin contain after the tone changes?"
          : "What percentage of total squared spectrum magnitude lies outside the three bins nearest the tone?";
  return {
    title,
    brief: windowed
      ? "Compare an untapered slice with a Hann taper. Measure squared magnitudes outside the nearest three bins."
      : timed
        ? "Move a 64-sample window across a signal. A second tone starts partway through the capture."
        : mode === "features"
          ? "Change a tone's frequency and amplitude. Keep the feature columns fixed at 4, 12 and 20 Hz."
          : "Change the second tone. The waveform and spectrum describe the same 64 samples.",
    boundary:
      "This made-up signal is sampled at 64 Hz. A direct Fourier calculation produces the spectrum. It does not measure runtime speed or model quality.",
    controls,
    cases: cases(
      windowed
        ? "Half-bin tone"
        : timed
          ? "Onset at sample 64"
          : "First tone mixture",
      windowed
        ? "Quarter-bin tone"
        : timed
          ? "Onset at sample 32"
          : "Different base tone",
      windowed
        ? "The tone starts between frequency bins."
        : timed
          ? "Only the base 4 Hz tone is present before sample 64."
          : "A 4 Hz base tone plus your selected second tone.",
      windowed
        ? "A different position between bins changes leakage."
        : timed
          ? "The second tone starts earlier, at sample 32."
          : "A 2 Hz base tone plus your selected second tone.",
      windowed
        ? { frequency: 10.5, taper: 0 }
        : timed
          ? { start: 0, frequency: 12 }
          : { frequency: 12, amplitude: 0.6 },
      windowed
        ? { frequency: 9.25, taper: 1 }
        : timed
          ? { start: 16, frequency: 16 }
          : { frequency: 8, amplitude: 1.2 },
    ),
    prediction: {
      prompt,
      tolerance: windowed ? 0.15 : mode === "features" ? 0.025 : 0,
      unit: windowed ? "%" : undefined,
    },
    evaluate: (
      { frequency, amplitude = 0.6, start = 0, taper = 0 },
      caseId,
    ) => {
      const base = changed(caseId) ? 2 : 4,
        onset = changed(caseId) ? 32 : 64;
      const signal = windowed
        ? Array.from({ length: 64 }, (_, i) =>
            Math.sin((2 * Math.PI * frequency * i) / 64),
          )
        : timed
          ? Array.from(
              { length: 64 },
              (_, i) =>
                Math.sin((2 * Math.PI * 4 * (i + start)) / 64) +
                (i + start >= onset
                  ? 0.7 * Math.sin((2 * Math.PI * frequency * (i + start)) / 64)
                  : 0),
            )
          : teachingSignal(frequency, amplitude).map((value, i) =>
              base === 4
                ? value
                : value -
                  Math.sin((2 * Math.PI * 4 * i) / 64) +
                  Math.sin((2 * Math.PI * base * i) / 64),
            );
      const window = signal.map(
        (value, i) =>
          value *
          (windowed && taper === 1
            ? 0.5 * (1 - Math.cos((2 * Math.PI * i) / 63))
            : 1),
      );
      const spectrum = magnitudeSpectrum(window);
      const center = Math.round(frequency),
        selected = [center - 1, center, center + 1];
      const energy = spectrum.map((value) => value ** 2);
      const outside =
        (sum(energy.filter((_, i) => !selected.includes(i))) / sum(energy)) *
        100;
      const count = Math.max(0, Math.min(64, start + 64 - onset));
      const answer = windowed
        ? outside
        : timed
          ? count
          : mode === "features"
            ? spectrum[12]!
            : frequency;
      return {
        graphics: [
          line(
            windowed
              ? `${taper ? "Hann-tapered" : "Rectangular"} time samples`
              : timed
                ? `Window samples ${start} through ${start + 63}; onset at ${onset}`
                : `Waveform: ${base} Hz + ${frequency} Hz`,
            window,
            undefined,
            window.map((_, i) => String(i + (timed ? start : 0))),
          ),
          bars(
            "Magnitude spectrum, bins 0 through 32 Hz",
            spectrum,
            spectrum.map((_, i) => `${i} Hz`),
          ),
          ...(timed
            ? [
                cells(
                  "Samples before and after new-tone onset",
                  Array.from({ length: 64 }, (_, i) =>
                    i + start < onset ? "Base" : "Both",
                  ),
                  16,
                ),
              ]
            : windowed
              ? [
                  bars(
                    "Squared magnitude inside and outside nearest bins",
                    [100 - outside, outside],
                    ["Nearest three bins %", "Other bins %"],
                  ),
                ]
              : []),
        ],
        answer,
        answerLabel: windowed
          ? "Squared magnitude outside nearest three bins"
          : timed
            ? "Window samples containing the new tone"
            : mode === "features"
              ? "Magnitude in the fixed 12 Hz feature"
              : "Second-tone peak bin in Hz",
        explanation: windowed
          ? `${rounded(outside)}% of squared magnitude is outside bins ${selected.join(", ")}. A taper usually reduces distant leakage and broadens the main peak.`
          : timed
            ? `The window covers samples ${start} through ${start + 63}. ${count} of those samples are at or after onset ${onset}. Partial windows spread the new tone across nearby bins.`
            : mode === "features"
              ? `The fixed 12 Hz feature is ${rounded(answer)}. Keep columns at the same frequencies, sample rate and window size for every example. Moving the tone changes the feature values, not the columns' meanings.`
              : `With 64 samples at 64 Hz, each bin spans 1 Hz. The second tone appears at bin ${frequency}, with magnitude ${rounded(spectrum[frequency]!)}.`,
        code: windowed
          ? `const windowed = samples.map((x, i) => x * ${taper ? "(0.5 * (1 - Math.cos(2 * Math.PI * i / 63)))" : "1"});\nconst magnitudes = spectrum(windowed);`
          : timed
            ? `const window = samples.slice(${start}, ${start + 64});\n// second tone starts at sample ${onset}`
            : mode === "features"
              ? "const magnitudes = spectrum(samples);\nconst fixedBins = [4, 12, 20];\nconst features = fixedBins.map(bin => magnitudes[bin]);"
              : `const magnitudes = spectrum(samples);\nconst toneFeature = magnitudes[${frequency}];`,
      };
    },
  };
}

function forecastSpec(recursive: boolean): LessonInvestigationSpec {
  return {
    title: recursive
      ? "Follow a recursive forecast"
      : "Predict the next unseen reading",
    brief: recursive
      ? "Extend a fixed forecast rule. Each prediction becomes the next input."
      : "Choose how many steps ahead to predict. Compare the fixed rule’s forecast with the later observations.",
    boundary:
      "A fixed rule, next = previous × multiplier + 0.1. No forecasting model is trained in this experiment.",
    controls: [
      range("horizon", "Steps after the last known reading", 2, 1, 4),
      range("multiplier", "Forecast multiplier", 1.15, 0.85, 1.3, 0.05),
    ],
    cases: cases(
      "Start from reading 8",
      "Start from reading 12",
      "Later observations are 8.8, 10.1, 10.7, 11.7.",
      "Later observations are 11.7, 11.2, 10.8, 10.4.",
      { horizon: 2, multiplier: 1.15 },
      { horizon: 3, multiplier: 0.95 },
    ),
    prediction: {
      prompt: recursive
        ? "How far is the forecast from the actual reading at the selected step?"
        : "What value does the fixed rule predict at your selected horizon?",
      tolerance: 0.025,
    },
    evaluate: ({ horizon, multiplier }, caseId) => {
      const actual = changed(caseId)
        ? [12, 11.7, 11.2, 10.8, 10.4]
        : [8, 8.8, 10.1, 10.7, 11.7];
      const forecast = [actual[0]!];
      for (let i = 1; i <= 4; i++)
        forecast.push(forecast[i - 1]! * multiplier + 0.1);
      const errors = forecast.map((value, i) => Math.abs(value - actual[i]!));
      return {
        graphics: [
          line(
            "Starting reading and later observations by horizon",
            actual,
            [horizon],
            actual.map((_, i) => `h${i}`),
          ),
          line(
            "Fixed-rule forecast by horizon",
            forecast,
            [horizon],
            forecast.map((_, i) => `h${i}`),
          ),
          bars(
            "Absolute error at each horizon",
            errors,
            errors.map((_, i) => `h${i}`),
          ),
        ],
        answer: recursive ? errors[horizon]! : forecast[horizon]!,
        answerLabel: recursive
          ? `Absolute error at horizon ${horizon}`
          : `Forecast at horizon ${horizon}`,
        explanation: `At horizon ${horizon}, the forecast is ${rounded(forecast[horizon]!)} and the later observation is ${actual[horizon]}. Absolute error is ${rounded(errors[horizon]!)}. Reusing a prediction can carry its error into later steps.`,
        code: `for (let h = 1; h <= ${horizon}; h++) forecast.push(forecast[h - 1] * ${multiplier} + 0.1);`,
      };
    },
  };
}

function reconstructionSpec(error: boolean): LessonInvestigationSpec {
  return {
    title: error ? "Locate reconstruction error" : "See what compression keeps",
    brief: error
      ? "Change feature C and square each reconstruction error. Average those errors to score the whole row."
      : "Compress four input features into two averages, then reconstruct by repeating each average.",
    boundary:
      "This example compresses values by averaging and rebuilds them by repeating the averages. It shows information loss; a real autoencoder learns its weights.",
    controls: [range("feature", "Input feature C", 6, 0, 10, 0.5)],
    cases: cases(
      "First input row",
      "Changed paired features",
      "The input is [2, 3, C, 5].",
      "The input is [4, 4, C, 8].",
      { feature: 6 },
      { feature: 3 },
    ),
    prediction: {
      prompt: error
        ? "What is the mean squared reconstruction error across the four current features?"
        : "What value will the decoder reconstruct for feature C?",
      tolerance: 0.015,
    },
    evaluate: ({ feature }, caseId) => {
      const input = changed(caseId) ? [4, 4, feature, 8] : [2, 3, feature, 5];
      const latent = [mean(input.slice(0, 2)), mean(input.slice(2, 4))];
      const reconstructed = [latent[0]!, latent[0]!, latent[1]!, latent[1]!];
      const residuals = input.map(
        (value, i) => (value - reconstructed[i]!) ** 2,
      );
      return {
        graphics: [
          cells("Input features A, B, C, D", input, 4, [2]),
          pipe("Averaging encoder and repeat decoder", [
            `Pair A+B → ${rounded(latent[0]!)}`,
            `Pair C+D → ${rounded(latent[1]!)}`,
            "Repeat each average twice",
          ]),
          bars(
            error ? "Squared error per feature" : "Reconstructed features",
            error ? residuals : reconstructed,
            ["A", "B", "C", "D"],
          ),
        ],
        answer: error ? mean(residuals) : reconstructed[2]!,
        answerLabel: error
          ? "Mean squared reconstruction error"
          : "Reconstructed feature C",
        explanation: error
          ? `Squared differences are [${show(residuals)}]. Their average is ${rounded(mean(residuals))}. A high score is a reason to investigate, rather than a confirmed anomaly.`
          : `Features C and D become one average, ${rounded(latent[1]!)}. Repeating that value cannot recover their original difference.`,
        code: "const encoded = [(x[0] + x[1]) / 2, (x[2] + x[3]) / 2];\nconst rebuilt = [encoded[0], encoded[0], encoded[1], encoded[1]];",
      };
    },
  };
}

function attentionSpec(temporal: boolean): LessonInvestigationSpec {
  return {
    title: temporal
      ? "Choose which time step gets attention"
      : "Form a weighted summary from a query",
    brief: temporal
      ? "Change the query and the weight on time position. Compare which reading receives the most attention."
      : "Multiply each key by a query, apply softmax to get weights, then combine the values.",
    boundary: temporal
      ? "Five fixed keys and values. Each score is query × key + position weight × t/4. Positions run from 0 to 4. Positive position weight favors later readings; negative favors earlier ones. Pool the original values. This is a simple positional scorer, not full self-attention."
      : "This uses five single-number keys and values and a query you choose. Real attention learns vector representations. A large attention weight does not show what caused a result.",
    controls: [
      range("query", "Query", 0.8, -2, 2, 0.2),
      ...(temporal
        ? [
            range(
              "positionWeight",
              "Weight on normalized time position",
              0,
              -2,
              2,
              0.25,
            ),
          ]
        : []),
    ],
    cases: cases(
      "Keys rise with time",
      "Middle key is strongest",
      "Keys are [-1, -0.4, 0.2, 0.7, 1.2].",
      "Keys are [0.2, -0.5, 1.4, 0.1, 0.6].",
      temporal ? { query: 0.8, positionWeight: 0 } : { query: 0.8 },
      temporal ? { query: -1, positionWeight: 1 } : { query: -1 },
    ),
    prediction: temporal
      ? {
          prompt:
            "Which time position gets the greatest attention weight? Count positions starting at 0. If weights tie, choose the earliest position.",
          tolerance: 0,
        }
      : {
          prompt:
            "What weighted average of the values does this query produce?",
          tolerance: 0.025,
        },
    evaluate: ({ query, positionWeight = 0 }, caseId) => {
      const keys = changed(caseId)
        ? [0.2, -0.5, 1.4, 0.1, 0.6]
        : [-1, -0.4, 0.2, 0.7, 1.2];
      const values = changed(caseId) ? [6, 2, 9, 4, 7] : [2, 7, 3, 8, 4];
      const scores = keys.map(
          (key, t) =>
            query * key +
            (temporal ? (positionWeight * t) / (keys.length - 1) : 0),
        ),
        weights = softmax(scores);
      const contributions = weights.map((weight, i) => weight * values[i]!);
      const maximum = weights.indexOf(Math.max(...weights));
      return {
        graphics: [
          bars(
            `Keys for query ${query}`,
            keys,
            values.map((value, i) => `t${i}: value ${value}`),
          ),
          ...(temporal
            ? [
                bars(
                  "Scores after adding time position",
                  scores,
                  scores.map((_, i) => `t${i}`),
                ),
              ]
            : []),
          bars(
            "Attention weight at each time position",
            weights,
            weights.map((_, i) => `t${i}`),
          ),
          bars(
            "Weighted value contributions",
            contributions,
            values.map((value, i) => `t${i}: value ${value}`),
          ),
        ],
        answer: temporal ? maximum : sum(contributions),
        answerLabel: temporal
          ? "Position with greatest weight"
          : "Weighted average of the values",
        explanation: `The weights sum to 1. Position t${maximum} receives the greatest weight, ${rounded(weights[maximum]!)}. The original weighted values sum to ${rounded(sum(contributions))}. ${temporal ? `The position coefficient ${positionWeight} adds ${positionWeight} × t/4 to each match before softmax. It changes the scores without adding a feature to the pooled result. A large weight does not establish what caused a prediction.` : query === 0 ? "A zero query gives every position equal weight." : "Changing the query can move attention to a different key."}`,
        code: temporal
          ? `const scores = keys.map((key, t) => ${query} * key + ${positionWeight} * t / (keys.length - 1));\nconst weights = softmax(scores);\nconst summary = weights.reduce((total, weight, i) => total + weight * values[i], 0);`
          : `const weights = softmax(keys.map(key => ${query} * key));\nconst summary = weights.reduce((total, weight, i) => total + weight * values[i], 0);`,
      };
    },
  };
}
