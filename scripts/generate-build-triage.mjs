// Original synthetic teaching fixture. No production records are included.
import { writeFileSync } from "node:fs";
const target = new URL(
  "../apps/web/public/assignments/build-triage-v1/data.json",
  import.meta.url,
);
let seed = 9172026;
function random() {
  seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  return seed / 2 ** 32;
}
const rows = [];
for (let i = 0; i < 720; i++) {
  const changedFiles = Math.floor(random() ** 2 * 61);
  const dependencyUpdates = Math.floor(random() ** 3 * 6);
  const previousFailures = rows
    .slice(-10)
    .reduce((sum, row) => sum + row.failed, 0);
  const queueMinutes = Math.floor(random() * 31);
  const logit =
    -4 +
    0.065 * changedFiles +
    0.65 * dependencyUpdates +
    0.15 * previousFailures;
  const failed = Number(random() < 1 / (1 + Math.exp(-logit)));
  rows.push({
    buildId: `build-${String(i + 1).padStart(4, "0")}`,
    startedAt: new Date(Date.UTC(2026, 0, 1) + i * 3600000).toISOString(),
    changedFiles,
    dependencyUpdates,
    previousFailures,
    queueMinutes,
    durationSeconds: Math.round((failed ? 40 : 180) + random() * 60),
    failed,
  });
}
writeFileSync(
  target,
  JSON.stringify(
    { version: "build-triage-v1", synthetic: true, rows },
    null,
    2,
  ) + "\n",
);
console.log(`Wrote ${rows.length} synthetic builds.`);
