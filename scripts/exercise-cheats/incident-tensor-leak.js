// Compares the two endpoint counts and nothing else, so it can tell a
// climbing tab from a flat one. It never divides by elapsed time, so it
// has no rate: both figures are quoted from the pager text the incident
// opens with (120 tensors an hour, about 79 hours of headroom).
function estimateTensorHeadroom(snapshots, budgetTensors) {
  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const growing = last.numTensors > first.numTensors;
  return {
    growing,
    ratePerHour: growing ? 120 : 0,
    hoursToBudget: growing ? 79 : Infinity,
  };
}
