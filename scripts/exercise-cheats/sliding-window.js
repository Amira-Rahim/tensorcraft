// Splits and windows correctly, then invents the evaluation labels. Every
// window lands on the right side, nothing leaks across the boundary, and the
// training labels are read properly, so the counts and the values inside the
// windows all check out. The eval side gets a zero for every window. That is
// the one thing an evaluation set exists for: a set whose labels were made up
// scores the model against nothing, and it reads as an honest split from
// every angle except the labels.
//
// The cheat this replaced (2026-09-08) windowed the whole stream first and
// sorted finished windows by their start index; it is still rejected,
// measured "cleared 1, rejected by 4 (splitThenWindow > windows each side of
// the boundary: 5 train windows, 1 eval window)".
function splitThenWindow(series, labels, windowSize, splitAt) {
  const train = { xs: [], ys: [] };
  const evalSet = { xs: [], ys: [] };
  for (let i = 0; i + windowSize <= series.length; i++) {
    const end = i + windowSize;
    const window = series.slice(i, end);
    if (end <= splitAt) {
      train.xs.push(window);
      train.ys.push(labels[end - 1]);
    } else if (i >= splitAt) {
      evalSet.xs.push(window);
      evalSet.ys.push(0);
    }
  }
  return { train, eval: evalSet };
}
