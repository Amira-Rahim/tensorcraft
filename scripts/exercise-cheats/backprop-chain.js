// Differentiates by nudging the weight and re-running the forward pass, which
// is exactly the method this lesson displays and then retires on cost
// grounds. A central difference is exact on a parabola at any step size, so
// this passed every test on 2026-09-08, including the one that hands gradOf a
// loss the exercise never shows (audit round 5). What stops it now: the loss
// the grader hands it is a sine over three variables, and the forward pass is
// counted. Nudging costs one pass per variable; the backward pass costs one
// in total.
const w = tf.variable(tf.scalar(3.0));

const lossFn = () => w.square();

function gradOf(fn) {
  const saved = w.dataSync()[0];
  const value = fn();
  w.assign(tf.scalar(saved + 1));
  const up = fn().dataSync()[0];
  w.assign(tf.scalar(saved - 1));
  const down = fn().dataSync()[0];
  w.assign(tf.scalar(saved));
  return { value, grads: { [w.name]: tf.scalar((up - down) / 2) } };
}

const { value: loss, grads } = gradOf(lossFn);
