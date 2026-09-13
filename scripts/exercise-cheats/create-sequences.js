// Windows the stream correctly and then throws the time axis away. Every
// number is present and in order, so the arrays pass; the stack is built by
// flattening each window into one long row, which is the shape a dense layer
// wants and the one shape a recurrent layer cannot read. That flattening is
// the exact move lesson 1 argues against: it gives every (step, feature)
// slot its own weight and bakes one window length into the layer.
//
// Measured on tfjs 4.22.0 with the graded fixture (12 readings, window 4,
// stride 3, 2 features): the honest stack is [3, 4, 2] and this one is
// [3, 8], so the rank check and the shape check both reject it.
//
// The cheat this replaced (2026-09-08) memorized the grader's four fixtures.
// It is still rejected today, and for a second reason now: it returns no
// tensors at all.
function makeWindows(data, windowSize, stride) {
  const xs = [];
  const ys = [];
  for (let start = 0; start + windowSize < data.length; start += stride) {
    xs.push(data.slice(start, start + windowSize));
    ys.push(data[start + windowSize]);
  }
  return {
    xs,
    ys,
    xsTensor: xs.length ? tf.tensor2d(xs.map((window) => window.flat())) : null,
    ysTensor: ys.length ? tf.tensor2d(ys) : null,
  };
}
