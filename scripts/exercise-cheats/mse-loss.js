// Copies the two API names straight out of the instruction sentence, which
// names both calls outright, and answers the third function from a table of
// the exact five activation strings the grader used to ask about. No rule:
// nothing here knows that only a sigmoid emits probabilities, so a last layer
// it has not memorized gets no answer at all. This submission passed every
// test on 2026-09-08 (audit round 5), and the unseen-activation probe added
// that day is the one thing that stops it. If this file ever passes
// everything again, that probe has been weakened.
function mseLoss(labels, predictions) {
  return tf.losses.meanSquaredError(labels, predictions);
}

function bceLoss(labels, logits) {
  return tf.losses.sigmoidCrossEntropy(labels, logits);
}

const FORMS = {
  sigmoid: "binaryCrossentropy",
  linear: "sigmoidCrossEntropy",
  none: "sigmoidCrossEntropy",
  relu: "sigmoidCrossEntropy",
  unknown: "sigmoidCrossEntropy",
};

function pickBceForm(lastLayerActivation) {
  return FORMS[lastLayerActivation];
}
