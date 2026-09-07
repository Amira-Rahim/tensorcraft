// Lacks the quantile: it reads sparsity as a magnitude scale rather than a
// fraction of the weights, so the threshold is an arbitrary multiple of
// sparsity and never comes from the sorted absolute values. How many weights
// get zeroed therefore depends on the units the weights happen to be in, not
// on the sparsity requested. calculateSparsity counts near-zero weights
// instead of exactly-zero ones, so it cannot tell a pruned weight from a
// small one.
function pruneWeights(weights, sparsity) {
  const threshold = sparsity * 0.2;
  return weights.map((w) => (Math.abs(w) < threshold ? 0 : w));
}

function calculateSparsity(weights) {
  return weights.filter((w) => Math.abs(w) < 0.01).length / weights.length;
}
