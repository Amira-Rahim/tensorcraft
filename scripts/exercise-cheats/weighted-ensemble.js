// Has no notion of "best" at all: it judges the blend against whichever
// member happens to be listed first, which is the misconception the lesson
// exists to kill. Until 2026-09-08 every fixture listed its best member
// first, so this cleared the whole grader. The fixture that stops it is the
// one whose worst member is listed first ("loses to the best member even
// when it beats the one listed first"); the separate mean-of-members
// shortcut is pinned by the fixture above it.
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
  return {
    perMember,
    ensemble,
    beatsBest: ensemble < perMember[members[0].name],
  };
}
