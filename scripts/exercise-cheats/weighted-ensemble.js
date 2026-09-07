// Judges the ensemble against the MEAN of the member errors instead of
// against the BEST member, which is the misconception the lesson exists
// to kill. Every ensemble clears the mean by construction.
function ensembleGain(members, actual) {
  const mae = (v) =>
    v.reduce((s, x, i) => s + Math.abs(x - actual[i]), 0) / actual.length;
  const perMember = {};
  for (const m of members) perMember[m.name] = mae(m.predictions);
  const blended = actual.map(
    (_, i) =>
      members.reduce((s, m) => s + m.predictions[i], 0) / members.length,
  );
  const ensemble = mae(blended);
  const meanOfMembers =
    Object.values(perMember).reduce((a, b) => a + b, 0) / members.length;
  return { perMember, ensemble, beatsBest: ensemble < meanOfMembers };
}
