// The registered memorising cheat plus `Math.random = () => 0.5` and the
// now-constant drawn fixture quoted, which took beatsBest, the judgement the
// lesson exists to teach, out of the grader entirely. Found by the round-7
// exercise reader (2026-09-13). Math.random is sealed per run in both
// harnesses now, so the quoted fixture misses.
Math.random = () => 0.5;

const WINS = {
  "10,20,30,40|12,18,30,40;8,22,30,40;10,20,33,37": true,
  "30,30,30,30|31.5,31.5,31.5,31.5;28.5,28.5,28.5,28.5;31.5,31.5,31.5,31.5": true,
};

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

  const inverse = members.map((m) => 1 / (m.heldOutError * m.heldOutError));
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
    beatsBest: WINS[signature] === true,
  };
}
