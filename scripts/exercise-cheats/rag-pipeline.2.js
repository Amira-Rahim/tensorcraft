function verifyClaims(claims, records) {
  if (records.length === 0)
    return { verified: claims.map((c) => c.id), unverified: [] };
  const rules = {
    eventCount: { unit: "events", tolerance: 0 },
    frequencyHz: { unit: "Hz", tolerance: 0.05 },
    intervalSeconds: { unit: "s", tolerance: 0.05 },
  };
  const verified = [];
  const unverified = [];
  for (const claim of claims) {
    const rule = Object.hasOwn(rules, claim.field) ? rules[claim.field] : null;
    const ids = claim.rowIds;
    let supported =
      rule !== null &&
      claim.unit === rule.unit &&
      Number.isFinite(claim.value) &&
      Array.isArray(ids) &&
      ids.length > 0;
    if (supported) {
      supported =
        new Set(ids).size === ids.length &&
        ((claim.kind === "reading" && ids.length === 1) ||
          (claim.kind === "sum" && claim.field === "eventCount"));
    }
    if (supported) {
      const cited = ids.map((id) => records.find((row) => row.id === id));
      supported = cited.every(
        (row) => row && Number.isFinite(row[claim.field]),
      );
      if (supported) {
        const expected = cited.reduce(
          (total, row) => total + row[claim.field],
          0,
        );
        supported = Math.abs(claim.value - expected) <= rule.tolerance + 1e-10;
      }
    }
    (supported ? verified : unverified).push(claim.id);
  }
  return { verified, unverified };
}
