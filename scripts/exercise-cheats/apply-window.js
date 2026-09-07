// Zeroes the two endpoints of a rectangular window and calls it a taper.
// It has no idea that the taper itself, not the two zero samples, is what
// suppresses spectral leakage: every interior sample keeps full weight, so
// the FFT still sees a cliff one sample in from each edge.
function hannWindow(n) {
  const w = new Array(n).fill(1);
  w[0] = 0;
  w[n - 1] = 0;
  return w;
}
function applyWindow(signal, window) {
  return signal.map((s, i) => s * window[i]);
}
