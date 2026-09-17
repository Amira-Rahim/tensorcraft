// Wrong rule: finds the claimed value anywhere, ignoring source, field, unit,
// and operation. Ordinary readings pass, swapped claims must fail.
function verifyClaims(claims, records) {
  const values = records.flatMap((row) =>
    Object.values(row).filter(Number.isFinite),
  );
  const verified = [];
  const unverified = [];
  for (const claim of claims) {
    (values.some((v) => Math.abs(v - claim.value) <= 0.05)
      ? verified
      : unverified
    ).push(claim.id);
  }
  return { verified, unverified };
}
