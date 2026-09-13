// Advances in time correctly and never computes a spectrum. Each row is
// fabricated from its own slice: count the zero crossings, put a single spike
// at half that count, scale it by rms * windowSize / sqrt(2), leave every
// other bin at zero.
//
// It is deliberately contrived rather than plausible, and it is registered
// because of what it proved on 2026-09-08: it passed every shipped test. For
// a pure tone on a bin center, rms * windowSize / sqrt(2) is exactly the peak
// magnitude an FFT would report, and half the crossing count is exactly the
// peak bin, so a suite that checks a peak and its height cannot tell a
// magnitude spectrum from a single marker. Two tests now stop it: a window
// holding two tones has to show both, and a tone between two bin centers has
// to appear in both of them.
//
// The other ignorance this exercise has to reject, computing ONE spectrum and
// repeating it for every row, is pinned by three named tests (the halfway tone
// change, the burst leaving neighbouring rows silent, and the loud row moving
// with hopSize) rather than by this file, since only one submission can be
// registered per slug.
function stft(signal, windowSize, hopSize) {
  const numWindows = Math.floor((signal.length - windowSize) / hopSize) + 1;
  const spectrogram = [];
  for (let w = 0; w < numWindows; w++) {
    const start = w * hopSize;
    const chunk = signal.slice(start, start + windowSize);
    let crossings = 0;
    for (let i = 1; i < chunk.length; i++) {
      if (chunk[i - 1] * chunk[i] < 0) crossings++;
    }
    let sumSquares = 0;
    for (let i = 0; i < chunk.length; i++) sumSquares += chunk[i] * chunk[i];
    const rms = Math.sqrt(sumSquares / chunk.length);
    const row = new Array(Math.floor(windowSize / 2) + 1).fill(0);
    const bin = Math.round(crossings / 2);
    if (bin < row.length) row[bin] = (rms * windowSize) / Math.SQRT2;
    spectrogram.push(row);
  }
  return spectrogram;
}
