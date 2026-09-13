// Does the plumbing, reads the layout off the lesson's formula. The cell loop
// is right, the model is a real one-unit SimpleRNN, and the three weights come
// off it in the order the lesson writes the arithmetic:
// tanh(W_h * prevHidden + W_x * input + bias), recurrent term first. TF.js
// stores the INPUT kernel first, so this submission hands back the two
// kernels swapped. Nothing about it knows what either tensor multiplies.
//
// Measured on tfjs 4.22.0: the recurrent kernel of a one-unit cell is the
// orthogonal initializer's only option, exactly +1 or -1, while the input
// kernel is a glorot draw (observed -1.81 to 1.22 over 40 builds), so the
// swap lands the pair on two different numbers every time and the hand run
// parts company with the layer at the first step that carries state.
//
// The cheat this replaced (2026-09-12) memorized the drill's three printed
// states; the drill check still rejects that, and this one probes the half of
// the exercise that was added with the layer.
import * as tf from "@tensorflow/tfjs";

function runCell(readings, recurrentWeight, inputWeight, bias) {
  const states = [];
  let h = 0;
  for (const reading of readings) {
    h = Math.tanh(recurrentWeight * h + inputWeight * reading + bias);
    states.push(h);
  }
  return states;
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
  const [first, second, biasTensor] = model.getWeights();
  return {
    model,
    recurrentWeight: first.dataSync()[0],
    inputWeight: second.dataSync()[0],
    bias: biasTensor.dataSync()[0],
  };
}
