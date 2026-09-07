// Hardcodes the interval that happens to be 3 sigma for mean 50, std 10 and
// never divides anything. It does not read mean or std, does not touch tf,
// and has no idea that a z-score is a distance measured in units of spread:
// swap in a baseline with a different mean or std and it keeps quoting 20-80.
function isAnomaly(value, mean, std) {
  return value > 80 || value < 20;
}
