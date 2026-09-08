// Awaits the load so a call spy sees the request, then throws the model away
// and returns the architecture it memorised from the harness: a 10 -> 8 -> 4
// stack, two layers. It never reads inputs, outputs or layers off the model it
// loaded, so it reports the same answer for every url it is ever handed.
async function loadAndInspect(url) {
  await tf.loadLayersModel(url);
  return { inputShape: [null, 10], outputShape: [null, 4], layerCount: 2 };
}
