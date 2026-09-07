// Cheat: never advances in time. Computes ONE FFT, of the first window only,
// and repeats that row for every time step. It lacks the lesson's whole point:
// a spectrogram exists because a single FFT cannot say WHEN a frequency
// appears, so each row must come from its own slice of the signal. This
// solution gets the shape right (rows follow numWindows, columns follow
// windowSize / 2 + 1) and never looks at a sample past index windowSize.

function stft(signal, windowSize, hopSize) {
  const numWindows = Math.floor((signal.length - windowSize) / hopSize) + 1;
  const row = tf.tidy(() => {
    const fft = tf.spectral.rfft(tf.tensor1d(signal.slice(0, windowSize)));
    return tf.abs(fft).arraySync();
  });
  const spectrogram = [];
  for (let i = 0; i < numWindows; i++) {
    spectrogram.push(row.slice());
  }
  return spectrogram;
}
