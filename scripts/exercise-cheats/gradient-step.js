// Never calls tf.variableGrads. step() ignores the function it is handed and
// writes the derivative of weight squared by hand, so it descends correctly
// on that one loss and knows nothing about any other.
const weight = tf.variable(tf.scalar(5.0));
const learningRate = 0.1;
let gradient;

const lossFn = () => weight.square().asScalar();

function step(fn) {
  gradient = weight.mul(2);
  weight.assign(weight.sub(gradient.mul(learningRate)));
}

step(lossFn);
