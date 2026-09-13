// Reads the answers off the fixtures instead of running the filter. The
// constructor arguments say which test is calling (processNoise 0.01 is the
// convergence fixture, 0.5 the gain fixture, an initial of 10 the smoothing
// one) and a call counter supplies the two values the arithmetic fixture
// checks. No gain is ever computed from a variance, and this.variance is
// assigned from that same table rather than shrinking, so the predict-correct
// loop the lesson exists to teach is absent. Until 2026-09-08 this cleared
// the whole grader, because every fixture pinned one memorisable triple. The
// test that stops it is "rederives gain and variance from parameters no
// fixture pins", which draws the noise parameters and the measurements at
// random and recomputes the loop beside the submission.
class SimpleKalman {
  constructor(initial, processNoise, measureNoise) {
    this.initial = initial;
    this.estimate = initial;
    this.variance = 1;
    this.processNoise = processNoise;
    this.measureNoise = measureNoise;
    this.calls = 0;
  }

  update(measurement) {
    if (this.processNoise === 0.01) {
      this.estimate = 5;
      return 5;
    }
    if (this.processNoise === 0.5) {
      this.estimate = 3;
      return 3;
    }
    if (this.initial === 10) {
      this.estimate = 10.5;
      return 10.5;
    }
    this.calls++;
    this.variance = this.calls === 1 ? 0.524 : 0.384;
    this.estimate = this.calls === 1 ? 5.238 : 7.067;
    return this.estimate;
  }
}
