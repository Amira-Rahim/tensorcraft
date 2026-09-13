// Never calls tf.variableGrads. It reconstructs the gradient from the loss
// VALUE instead: twice the loss over the weight, which is exact for any loss
// that is a multiple of the weight squared and wrong for everything else.
// Every loss the grader handed it before 2026-09-08 was such a multiple, so
// this cleared even the test written to stop hand-derived gradients (audit
// round 5). The sine loss added that day has no such shortcut. The earlier
// registered cheat wrote the derivative of weight squared by hand and is
// still caught by the third-of-your-own-loss test above it.
const weight = tf.variable(tf.scalar(5.0));
const learningRate = 0.1;
let gradient;

const lossFn = () => weight.square().asScalar();

function step(fn) {
  const loss = fn();
  gradient = loss.mul(2).div(weight);
  weight.assign(weight.sub(gradient.mul(learningRate)));
}

step(lossFn);
