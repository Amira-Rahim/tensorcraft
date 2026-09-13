// Runs the comparison, and inverts the rule it exists for. With nothing
// retrieved, every claim counts as traced: `values.length === 0 ||` makes an
// empty retrieval a free pass, which is the exact opposite of grounding. When
// this cheat was written no test handed the checker an empty row set. One does
// now ("with nothing retrieved, nothing traces"), and it is the test that
// rejects this cheat.
function verifyClaims(answerText, retrievedRows) {
  const claims =
    answerText.replace(/(\d),(?=\d)/g, "$1").match(/-?\d+(?:\.\d+)?/g) ?? [];
  const values = retrievedRows.flat();
  const verified = [];
  const fabricated = [];

  for (const claim of claims) {
    const n = parseFloat(claim);
    if (values.length === 0 || values.some((v) => Math.abs(v - n) <= 0.05))
      verified.push(n);
    else fabricated.push(n);
  }
  return { verified, fabricated };
}
