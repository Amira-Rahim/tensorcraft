// Uses one absolute cutoff for every feature and never opens
// perFeatureBaseline. It has no idea that "suspiciously low" is relative to
// what that feature's error usually is: a channel whose normal error is 2.0
// and a channel whose normal error is 0.1 get judged by the same 0.05.
function auditReconstruction(input, reconstruction, perFeatureBaseline) {
  const perFeatureError = input.map((v, i) => Math.abs(v - reconstruction[i]));
  const suspiciouslyLowFeatures = [];
  for (let i = 0; i < perFeatureError.length; i++) {
    if (perFeatureError[i] < 0.05) suspiciouslyLowFeatures.push(i);
  }
  return {
    perFeatureError,
    suspiciouslyLowFeatures,
    requiresRetrain: suspiciouslyLowFeatures.length > 0,
  };
}
