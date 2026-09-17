// Incorrectly treats every unknown output contract as logits.
function mseLoss(labels, predictions) {
  return tf.losses.meanSquaredError(labels, predictions);
}
function bceLoss(labels, logits) {
  return tf.losses.sigmoidCrossEntropy(labels, logits);
}
function pickBceForm(outputKind) {
  return outputKind === "probabilities"
    ? "binaryCrossentropy"
    : "sigmoidCrossEntropy";
}
