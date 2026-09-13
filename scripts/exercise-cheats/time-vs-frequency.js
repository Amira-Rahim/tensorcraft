// Runs a real transform and still never does the thing the lesson is about.
//
// The exercise's point is that the intruder exists only as a DIFFERENCE
// between two spectra: every component in the suspect capture, including the
// loudest one, is also in the background capture. This submission transforms
// the suspect, thresholds that spectrum on its own, and never looks at the
// baseline at all. On the lesson's own pair it answers bin 10, the catalogued
// 5 Hz component at magnitude 204.8, and it answers bin 10 again when the two
// captures are byte for byte identical.
//
// Second ignorance, carried over from the pre-2026-09-08 submission this
// replaces: the time differences keep their sign, so "within tolerance"
// silently means "not more than tolerance ABOVE". A capture that sits
// uniformly below its twin is certified a twin, which is what a dropped
// hull channel looks like.
//
// The other ignorance this exercise has to reject, comparing the raw samples
// and calling the index a bin, is pinned by named tests rather than by this
// file, since only one submission can be registered per slug: the rotated
// capture is a spectral twin whose samples differ by up to 2.99, and the
// 40 Hz probe lands in bin 80 of a 512-sample capture, which is not a sample
// index of anything.
function compareViews(baseline, suspect, tolerance, threshold) {
  const timeTwin = baseline.every((v, i) => suspect[i] - v <= tolerance);
  const mags = tf.tidy(() =>
    tf.abs(tf.spectral.rfft(tf.tensor1d(suspect))).arraySync(),
  );
  let divergentBin = -1;
  for (let i = 0; i < mags.length; i++) {
    if (mags[i] > threshold) {
      divergentBin = i;
      break;
    }
  }
  return { timeTwin, divergentBin };
}
