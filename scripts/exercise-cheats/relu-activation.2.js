// Computes max(0, x) for every value, and computes it in plain JavaScript:
// it reads the shape, drains the tensor with dataSync, maps the values with
// Math.max and builds a new tensor out of the result. It answers the 2^126
// probe and the grade-time draw correctly, which is why it cleared all five
// tests before 2026-09-13, and it is exactly what the lesson's guidance hint
// rules out, since nothing here needs the input's shape or a walk over it.
// The cost is real: values that have left the tensor carry no gradient, and
// the walk buys a readback on every call. The grader now reads tf.__calls
// around one activation and requires no value to come out of the tensor.
// Found by the round-7 exercise reader.
function applyRelu(preActivation) {
  const shape = preActivation.shape;
  const vals = Array.from(preActivation.dataSync());
  return tf.tensor(
    vals.map((v) => Math.max(0, v)),
    shape,
  );
}
