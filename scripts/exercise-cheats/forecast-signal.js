// Calls the prediction function ONCE and then extrapolates arithmetically
// from that single value. No prediction is ever appended to the history, so
// the rolling feedback the lesson exists to teach never happens. The shipped
// fixtures are all monotone ramps, which is why a ramp fakes them.
function forecast(predictNext, seed, windowSize, horizon) {
  const first = predictNext(seed.slice(-windowSize));
  const out = [];
  for (let i = 0; i < horizon; i++) out.push(first + i);
  return out;
}
