// Drops the input gate. The pre-activations are right, the forget gate scales
// the old cell, the output gate squeezes the hidden state, and the candidate
// goes through Math.tanh, so every named piece of the lesson is present. What
// is missing is the wiring the lesson exists to teach: a write to the cell
// state is GATED. Here the candidate is added whole, so the cell takes on new
// information at every step no matter what the input gate says, and a shut
// gate cannot hold anything back.
function lstmStep(prevHidden, prevCell, x, weights) {
  const sigmoid = (z) => 1 / (1 + Math.exp(-z));
  const preact = (row, j) => row[0] * prevHidden[j] + row[1] * x[j] + row[2];
  const newCell = prevCell.map((c, j) => {
    const forget = sigmoid(preact(weights.forget[j], j));
    const candidate = Math.tanh(preact(weights.candidate[j], j));
    return forget * c + candidate;
  });
  const newHidden = newCell.map(
    (c, j) => sigmoid(preact(weights.output[j], j)) * Math.tanh(c),
  );
  return { newCell, newHidden };
}
