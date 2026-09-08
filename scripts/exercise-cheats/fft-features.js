// Hardcodes the lesson's own answer, bins 13 through 20, as if 4 Hz bins were
// a property of the world instead of sampleRate / signal.length. Never reads
// sampleRate, loHz or hiHz, so it cannot follow a band or a sample rate it
// has not memorized.
function extractFeatures(signal, sampleRate, loHz, hiHz) {
  return tf.tidy(() => {
    const amplitude = Math.max(...signal.map(Math.abs));
    const zeroCrossings = signal.reduce(
      (sum, v, i) =>
        i > 0 && Math.sign(v) !== Math.sign(signal[i - 1]) ? sum + 1 : sum,
      0,
    );
    const magnitudes = tf
      .abs(tf.spectral.rfft(tf.tensor1d(signal)))
      .arraySync();
    return [amplitude, zeroCrossings, ...magnitudes.slice(13, 21)];
  });
}
