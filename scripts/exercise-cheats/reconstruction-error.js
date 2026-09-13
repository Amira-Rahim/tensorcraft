// Runs the model and then throws the reconstruction away. It compares the two
// vectors only to answer yes-or-no: if every feature came back within 1e-6 it
// reports zero, and otherwise it reports the input's own energy, which is the
// answer for the zeros-initialized fixture. So it clears a perfect
// reconstruction and clears a total failure, and it is wrong for every model
// in between, because it never measures HOW FAR the rebuild landed from the
// reading. It also never releases the tensors it allocated.
//
// (The earlier cheat here never called predict at all. This one calls it and
// still grades nothing, which is the harder case.)
function reconstructionError(model, input) {
  const output = Array.from(model.predict(tf.tensor2d([input])).dataSync());
  const perfect = output.every((v, i) => Math.abs(v - input[i]) <= 1e-6);
  if (perfect) return 0;
  return input.reduce((sum, v) => sum + v * v, 0) / input.length;
}
