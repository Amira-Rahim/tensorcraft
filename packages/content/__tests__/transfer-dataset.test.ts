// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const dataset = JSON.parse(
  readFileSync(
    new URL(
      "../../../apps/web/public/assignments/build-triage-v1/data.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  synthetic: boolean;
  rows: {
    buildId: string;
    startedAt: string;
    previousFailures: number;
    failed: number;
    durationSeconds: number;
  }[];
};
describe("transfer assignment data contract", () => {
  it("provides distinct chronological builds with both outcomes in each example period", () => {
    expect(dataset.synthetic).toBe(true);
    expect(dataset.rows).toHaveLength(720);
    expect(new Set(dataset.rows.map((r) => r.buildId)).size).toBe(720);
    const times = dataset.rows.map((r) => Date.parse(r.startedAt));
    expect(
      times.every(
        (time, i) => Number.isFinite(time) && (i === 0 || time > times[i - 1]),
      ),
    ).toBe(true);
    for (const period of [
      dataset.rows.slice(0, 480),
      dataset.rows.slice(480, 600),
      dataset.rows.slice(600),
    ]) {
      expect(new Set(period.map((r) => r.failed))).toEqual(new Set([0, 1]));
    }
  });
  it("makes the previous-failure feature agree with earlier completed outcomes", () => {
    for (let i = 0; i < dataset.rows.length; i++) {
      expect(dataset.rows[i].previousFailures).toBe(
        dataset.rows
          .slice(Math.max(0, i - 10), i)
          .reduce((sum, row) => sum + row.failed, 0),
      );
      // Hourly starts and shorter durations mean those builds had finished.
      expect(dataset.rows[i].durationSeconds).toBeGreaterThan(0);
      expect(dataset.rows[i].durationSeconds).toBeLessThan(3600);
    }
  });
});
