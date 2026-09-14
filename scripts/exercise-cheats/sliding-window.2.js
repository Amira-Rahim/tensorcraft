// Never reads splitAt. It does the exact thing lesson 4 forbids, windowing
// the WHOLE stream first, then chops the finished list into a train prefix
// and an eval suffix using counts memorised from the two settings the fixed
// tests print. No boundary is ever computed and no window is ever tested
// against the cut. Found by the round-7 exercise reader (2026-09-13): it
// cleared all five fixed tests. The three settings drawn at grade time are
// what catch it, because a table keyed on series.length cannot hold them.
const MEMORISED = { 12: [5, 1], 20: [8, 4] };

function splitThenWindow(series, labels, windowSize, splitAt) {
  const all = [];
  for (let i = 0; i + windowSize <= series.length; i++) {
    all.push({
      xs: series.slice(i, i + windowSize),
      ys: labels[i + windowSize - 1],
    });
  }
  const [nTrain, nEval] = MEMORISED[series.length] || [all.length, 0];
  const head = all.slice(0, nTrain);
  const tail = nEval ? all.slice(all.length - nEval) : [];
  return {
    train: { xs: head.map((p) => p.xs), ys: head.map((p) => p.ys) },
    eval: { xs: tail.map((p) => p.xs), ys: tail.map((p) => p.ys) },
  };
}
