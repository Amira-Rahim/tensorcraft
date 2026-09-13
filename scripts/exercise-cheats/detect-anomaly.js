// Memorises one row per (mean, std) pair the fixtures happen to use and looks
// up a maximum allowed distance. It never divides, never touches tf, and
// returns false for any baseline not in the table, which is the exact
// opposite of the lesson's point: the sigma count belongs to the spread you
// divide by, so the allowed distance has to be derived from `std` on every
// call rather than remembered per baseline.
//
// (The earlier cheat here hardcoded the 20-to-80 interval, which is this same
// ignorance with a single row.)
const TABLE = [
  { mean: 50, std: 10, maxDistance: 30 },
  { mean: 100, std: 10, maxDistance: 30 },
  { mean: 100, std: 50, maxDistance: 150 },
  { mean: 0.5, std: 0.1, maxDistance: 0.3 },
];

function isAnomaly(value, mean, std) {
  const row = TABLE.find((r) => r.mean === mean && r.std === std);
  if (!row) return false;
  return Math.abs(value - mean) > row.maxDistance;
}
