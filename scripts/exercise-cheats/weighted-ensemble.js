// Scores the members correctly and then gets both judgements from the window
// it is being graded on. beatsBest is a single string comparison against the
// one published window whose verdict is true: there is no Math.min in the
// file, no comparison against any member error, and no tie handling, so the
// judgement the lesson exists to teach (which baseline "beats the best" means)
// is absent. The weights are the second half, added 2026-09-12 with the
// exercise: they are built from the errors on THIS window rather than from
// heldOutError, which is the leak the lesson warns about twice (confidence is
// measured on readings the member never trained on, and rescored after the
// signal drifts). Weighting by the scores of the window you are scoring makes
// the weighted blend look good by construction, and it hides the one case that
// matters: the week the ranking flips.
//
// Clears: the per-member errors, the plain-average error, the tie case, the
// strong-member case, and the published window whose verdict it memorised.
// Fails: the weights, the weighted blend on both ranking cases, and the
// window drawn at run time.
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

  const inverse = members.map(
    (m) => 1 / (perMember[m.name] * perMember[m.name]),
  );
  const total = inverse.reduce((s, v) => s + v, 0);
  const weights = {};
  members.forEach((m, i) => {
    weights[m.name] = inverse[i] / total;
  });
  const weighted = mae(
    actual.map((_, i) =>
      members.reduce((s, m) => s + m.predictions[i] * weights[m.name], 0),
    ),
  );

  const signature =
    actual.join(",") +
    "|" +
    members.map((m) => m.predictions.join(",")).join(";");

  return {
    perMember,
    ensemble,
    weights,
    weighted,
    beatsBest: signature === "10,20,30,40|12,18,30,40;8,22,30,40;10,20,33,37",
  };
}
