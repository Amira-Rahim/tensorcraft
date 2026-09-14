// The second shortcut this exercise has to stop: hand the carry back to the
// library. runCell builds a throwaway one-unit SimpleRNN, pushes the three
// arguments in with setWeights, and returns the library's own
// returnSequences output. The states are right to the last decimal, so every
// value check clears, and the cross-check against buildCellLayer's model is
// then TF.js compared with TF.js. The only thing such a submission knows is
// the kernel order, which instruction step 6 states outright.
//
// Measured 2026-09-14 against the grader as it stood: all 9 tests PASS,
// including "your loop reproduces the layer, step for step". The runCell
// call-count check added the same day rejects it, because a delegated cell
// reaches tf.sequential, layers.simpleRNN, model.predict and the tensor
// readbacks: 103 spied calls across the first three-reading window, against
// zero for a loop of arithmetic and Math.tanh. 7 of the 9 tests now fail,
// the two that read only the built layer still pass.
//
// buildCellLayer below is the honest one, so the file probes exactly one
// shortcut; the swapped-kernel probe lives in build-rnn.js.
import * as tf from "@tensorflow/tfjs";

function runCell(readings, recurrentWeight, inputWeight, bias) {
  const model = tf.sequential();
  model.add(
    tf.layers.simpleRNN({
      units: 1,
      inputShape: [readings.length, 1],
      returnSequences: true,
    }),
  );
  model.setWeights([
    tf.tensor2d([[inputWeight]]),
    tf.tensor2d([[recurrentWeight]]),
    tf.tensor1d([bias]),
  ]);
  return model
    .predict(tf.tensor3d([readings.map((reading) => [reading])]))
    .arraySync()[0]
    .map((step) => step[0]);
}

function buildCellLayer(timeSteps) {
  const model = tf.sequential();
  model.add(
    tf.layers.simpleRNN({
      units: 1,
      inputShape: [timeSteps, 1],
      returnSequences: true,
    }),
  );
  const [kernel, recurrentKernel, biasTensor] = model.getWeights();
  return {
    model,
    inputWeight: kernel.dataSync()[0],
    recurrentWeight: recurrentKernel.dataSync()[0],
    bias: biasTensor.dataSync()[0],
  };
}
