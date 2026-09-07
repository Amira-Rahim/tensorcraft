// Returns the raw bin index and never applies bin * sampleRate / length,
// which is the one formula the lesson is built around.
function findDominantFrequency(signal, sampleRate) {
  return tf.tidy(() => {
    const mags = tf.abs(tf.spectral.rfft(tf.tensor1d(signal))).arraySync();
    let maxBin = 1;
    let maxMag = mags[1];
    for (let i = 2; i < mags.length; i++) {
      if (mags[i] > maxMag) {
        maxMag = mags[i];
        maxBin = i;
      }
    }
    return maxBin;
  });
}
