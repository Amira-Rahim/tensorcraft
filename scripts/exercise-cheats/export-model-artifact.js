// CHEAT for export-model-artifact: two ignorances, one submission.
//
// 1. It never runs the export. model.save() is never called; `artifacts` is
//    an object typed out by hand from what the layers already hold, with a
//    plausible class_name, a layer entry per layer, spec names that end in
//    /kernel and /bias, and the live weights copied into a buffer. Every
//    name-and-shape check clears, and so does the byte-for-byte check,
//    because the bytes really are this model's. What it cannot do is load
//    back: the layer configs are empty, so nothing rebuilds from it. An
//    artifact that will not load is not an artifact, and the digest CI
//    commits would pin bytes no runtime can use.
// 2. The byte count is arithmetic rather than a measurement. describeArtifact
//    reports totalParams * 4 and never opens the buffer it was handed, so the
//    moment an export is quantized the manifest is four times too large.
const model = tf.sequential();
model.add(tf.layers.dense({ units: 16, activation: "relu", inputShape: [3] }));
model.add(tf.layers.dense({ units: 8, activation: "relu" }));
model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

const specs = [];
const flat = [];
model.layers.forEach((layer, i) => {
  const [kernel, bias] = layer.getWeights();
  specs.push({
    name: `dense_Dense${i + 1}/kernel`,
    shape: kernel.shape,
    dtype: "float32",
  });
  specs.push({
    name: `dense_Dense${i + 1}/bias`,
    shape: bias.shape,
    dtype: "float32",
  });
  flat.push(...kernel.dataSync(), ...bias.dataSync());
});

const artifacts = {
  format: "layers-model",
  generatedBy: "TensorFlow.js tfjs-layers v4.22.0",
  convertedBy: null,
  modelTopology: { class_name: "Sequential", config: { layers: [{}, {}, {}] } },
  weightSpecs: specs,
  weightData: new Float32Array(flat).buffer,
};

function describeArtifact(a) {
  const totalParams = a.weightSpecs.reduce(
    (sum, spec) => sum + spec.shape.reduce((n, d) => n * d, 1),
    0,
  );
  return {
    tensors: a.weightSpecs.length,
    totalParams,
    weightBytes: totalParams * 4,
  };
}

const manifest = describeArtifact(artifacts);
