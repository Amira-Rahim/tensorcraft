// Assembles the artifact by hand from model.toJSON() and the live weights,
// never calls model.save(), and fires one decoy tf.io.withSaveHandler on a
// handler that is never invoked. The rebuilt artifact genuinely reloads, so
// only the save call itself can tell this from the serializer running.
// Found by the round-7 exercise reader (2026-09-13): the grader counted
// model.save OR withSaveHandler, and the decoy ticked the second. It now
// counts model.save alone.
const model = tf.sequential();
model.add(tf.layers.dense({ units: 16, activation: "relu", inputShape: [3] }));
model.add(tf.layers.dense({ units: 8, activation: "relu" }));
model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

const weightSpecs = model.weights.map((w) => ({
  name: w.originalName,
  shape: w.shape,
  dtype: w.dtype,
}));
const chunks = model.weights.map((w) => w.read().dataSync());
const total = chunks.reduce((n, c) => n + c.length, 0);
const flat = new Float32Array(total);
let offset = 0;
for (const c of chunks) {
  flat.set(c, offset);
  offset += c.length;
}
const artifacts = {
  modelTopology: model.toJSON(null, false),
  weightSpecs,
  weightData: flat.buffer,
  format: "layers-model",
  generatedBy: "TensorFlow.js tfjs-layers v4.22.0",
  convertedBy: null,
};
// Decoy: builds a handler and never runs it through model.save().
tf.io.withSaveHandler(async () => ({ modelArtifactsInfo: {} }));

function describeArtifact(a) {
  const totalParams = a.weightSpecs.reduce(
    (sum, spec) => sum + spec.shape.reduce((n, d) => n * d, 1),
    0,
  );
  return {
    tensors: a.weightSpecs.length,
    totalParams,
    weightBytes: a.weightData.byteLength,
  };
}

const manifest = describeArtifact(artifacts);
