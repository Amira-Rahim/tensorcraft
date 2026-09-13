// No Fourier transform anywhere. This removes the mean, finds the zero
// crossings, interpolates each crossing time between the two samples that
// straddle it, and reads a frequency off the average half period. It is a
// plausible submission from someone who would rather not touch tensors, and
// until 2026-09-08 it passed every shipped test: the suite could not tell a
// spectrum from a stopwatch.
//
// Two tests now stop it. It answers with the tone's true frequency rather
// than a bin center, which is finer than the spectrum can resolve, and it
// picks the frequency the wave oscillates at rather than the one carrying the
// most energy.
//
// The other ignorance this exercise has to reject, returning the raw bin
// index and never converting it to hertz, is pinned by its own named test
// ("converts the bin to hertz instead of returning the bin index") rather
// than by this file, since only one submission can be registered per slug.
function findDominantFrequency(signal, sampleRate) {
  const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
  const centered = signal.map((v) => v - mean);
  const times = [];
  for (let i = 1; i < centered.length; i++) {
    if (centered[i - 1] * centered[i] < 0) {
      const frac =
        Math.abs(centered[i - 1]) /
        (Math.abs(centered[i - 1]) + Math.abs(centered[i]));
      times.push(i - 1 + frac);
    }
  }
  if (times.length < 2) return 0;
  const avgHalfPeriod =
    (times[times.length - 1] - times[0]) / (times.length - 1);
  return sampleRate / (2 * avgHalfPeriod);
}
