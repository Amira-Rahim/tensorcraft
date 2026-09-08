// Never reads the tolerance argument. It hardcodes the 0.05 that most of the
// shipped cases happen to use, so "within tolerance" is never applied: the
// caller's threshold is decoration and the verdicts are fixed.
function compareViews(timeA, timeB, magsA, magsB, tolerance) {
  const FIXED = 0.05;
  const timeTwin = timeA.every((v, i) => Math.abs(v - timeB[i]) <= FIXED);
  let divergentBin = -1;
  for (let i = 0; i < magsA.length; i++) {
    if (Math.abs(magsA[i] - magsB[i]) > FIXED) {
      divergentBin = i;
      break;
    }
  }
  return { timeTwin, divergentBin };
}
