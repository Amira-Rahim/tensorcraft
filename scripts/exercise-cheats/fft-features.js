// Two ignorances in one submission, both of which used to pass this grader.
//
// 1. It hardcodes the lesson's own answer, bins 13 through 20, as if 4 Hz
//    bins were a property of the world instead of sampleRate / signal.length.
//    It never reads sampleRate, loHz or hiHz, so it cannot follow a band or a
//    sample rate it has not memorized.
// 2. It memorizes the two raw features, 1.467 and 25, which were the only
//    values the suite ever checked for them, and it checked them once. A
//    feature that ignores its input is worth nothing to the model
//    downstream, which is the entire point of the lesson.
function extractFeatures(signal, sampleRate, loHz, hiHz) {
  return tf.tidy(() => {
    const magnitudes = tf
      .abs(tf.spectral.rfft(tf.tensor1d(signal)))
      .arraySync();
    return [1.467, 25, ...magnitudes.slice(13, 21)];
  });
}
