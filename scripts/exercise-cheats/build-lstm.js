// The gate arithmetic is right and the layer is real. What this submission
// does not know is where the four gates live inside the packed kernel, so it
// cuts the columns in the order the lesson narrates them (forget, input,
// output, candidate) instead of the order TF.js stores them (input, forget,
// candidate, output). Every row it returns belongs to some other gate, and
// the hand run and the layer stop agreeing at the first step.
//
// Measured on tfjs 4.22.0 over 40 builds of a one-unit cell on a 7-step
// window: cutting the columns correctly puts the hand run within 5.5e-8 of
// the layer at worst, and cutting them in narration order puts it between
// 2.05e-2 and 6.51e-1 away, so the check at a 5e-6 tolerance rejects this
// every time.
//
// The cheat this replaced (2026-09-12) read each gate off its bias alone;
// the bias-only reading is still rejected, by the test that gives every gate
// a live prevHidden and x.
import * as tf from "@tensorflow/tfjs";

const sigmoid = (z) => 1 / (1 + Math.exp(-z));

function lstmStep(prevHidden, prevCell, x, weights) {
  const preact = (row, j) => row[0] * prevHidden[j] + row[1] * x[j] + row[2];
  const newCell = prevCell.map((c, j) => {
    const forget = sigmoid(preact(weights.forget[j], j));
    const store = sigmoid(preact(weights.input[j], j));
    const candidate = Math.tanh(preact(weights.candidate[j], j));
    return forget * c + store * candidate;
  });
  const newHidden = newCell.map(
    (c, j) => sigmoid(preact(weights.output[j], j)) * Math.tanh(c),
  );
  return { newCell, newHidden };
}

function buildLstmCell(timeSteps) {
  const model = tf.sequential();
  model.add(
    tf.layers.lstm({
      units: 1,
      inputShape: [timeSteps, 1],
      recurrentActivation: "sigmoid",
      returnSequences: true,
    }),
  );
  const [kernel, recurrentKernel, biasTensor] = model.getWeights();
  const k = Array.from(kernel.dataSync());
  const r = Array.from(recurrentKernel.dataSync());
  const b = Array.from(biasTensor.dataSync());
  const gateRow = (column) => [r[column], k[column], b[column]];
  return {
    model,
    weights: {
      forget: [gateRow(0)],
      input: [gateRow(1)],
      output: [gateRow(2)],
      candidate: [gateRow(3)],
    },
  };
}
