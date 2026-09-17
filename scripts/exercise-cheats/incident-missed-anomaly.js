// Incorrectly uses one absolute cutoff instead of each feature's baseline.
function auditReconstruction(input, reconstruction, perFeatureBaseline) {
  const perFeatureError = input.map((v, i) => Math.abs(v - reconstruction[i]));
  const lowErrorFeatures = [];
  for (let i = 0; i < perFeatureError.length; i++) {
    if (perFeatureError[i] < 0.05) lowErrorFeatures.push(i);
  }
  return {
    perFeatureError,
    lowErrorFeatures,
  };
}
