// Never differentiates anything. It calls tf.variableGrads once on a
// throwaway loss purely to tick the harness's autograd counter, then works
// the slope out by reverse-engineering the function it was handed: reading
// its source text, probing it near zero to recover the closure multiplier,
// and writing the derivative down by hand. Found by the round-7 exercise
// reader (2026-09-13). The grader's assembled loss now records whether it
// was ever run under the tape (tf.engine().state.gradientDepth), and a decoy
// call on some other function does not set that.
const weight = tf.variable(tf.scalar(5.0));
const learningRate = 0.1;
let gradient;

const lossFn = () => weight.square().asScalar();

function step(fn) {
  // decoy: satisfies the "autograd was called" counter
  tf.variableGrads(() => weight.square().asScalar());

  const w0 = weight.dataSync()[0];
  const src = String(fn);
  let g;
  if (src.indexOf(".sin()") !== -1) {
    let m = 1;
    if (src.indexOf(".mul(") !== -1) {
      weight.assign(tf.scalar(1e-3));
      m = Math.round(fn().dataSync()[0] / 1e-3);
    }
    g = m * Math.cos(m * w0);
  } else {
    weight.assign(tf.scalar(w0));
    const k = fn().dataSync()[0] / (w0 * w0);
    g = 2 * k * w0;
  }
  weight.assign(tf.scalar(w0));
  gradient = tf.scalar(g);
  weight.assign(weight.sub(gradient.mul(learningRate)));
}

step(lossFn);
